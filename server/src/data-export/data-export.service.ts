import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { DataExport, DataExportStatus } from './entities/data-export.entity';
import { ExportSchedule } from './entities/export-schedule.entity';
import { ExportService } from './export.service';
import { User } from '../users/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

/** Allowed automatic-export cadences, in days. */
export const ALLOWED_EXPORT_INTERVALS = [7, 14, 30, 90];
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export interface ExportScheduleView {
  enabled: boolean;
  intervalDays: number;
  lastExportAt: string | null;
  nextExportAt: string | null;
}

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);
  private readonly exportQueue: DataExport[] = [];
  private isProcessing = false;
  private runningScheduledExports = false;

  constructor(
    @InjectRepository(DataExport)
    private dataExportRepository: Repository<DataExport>,
    @InjectRepository(ExportSchedule)
    private scheduleRepository: Repository<ExportSchedule>,
    private readonly exportService: ExportService,
    private readonly configService: ConfigService
  ) {}

  /** Where archives are written. Outside `uploads/` so they are NOT publicly served. */
  private get exportDir(): string {
    return path.resolve(this.configService.get('EXPORT_DIR', './exports'));
  }

  /** Where user media lives (read-only for archive bundling). */
  private get uploadDir(): string {
    return path.resolve(this.configService.get('UPLOAD_DIR', './uploads'));
  }

  async create(user: User, origin: 'manual' | 'scheduled' = 'manual'): Promise<DataExport> {
    const exportRequest = this.dataExportRepository.create({
      user,
      origin,
      status: DataExportStatus.PENDING,
    });

    const savedRequest = await this.dataExportRepository.save(exportRequest);
    try {
      await this.processExport(savedRequest);
      return savedRequest;
    } catch (error) {
      savedRequest.status = DataExportStatus.FAILED;
      await this.dataExportRepository.save(savedRequest);
      // Don't leave a partial zip / staging json behind on failure — the
      // nightly sweep would only get them after the retention window.
      await this.unlinkIfExists(path.join(this.exportDir, `${savedRequest.id}.zip`));
      await this.unlinkIfExists(path.join(this.exportDir, `${savedRequest.id}.json`));
      throw error;
    }
  }

  async getExport(user: User): Promise<DataExport | null> {
    return this.dataExportRepository.findOne({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  /** Recent export history (deletion workflows filtered out). */
  async listHistory(userId: string): Promise<
    Array<{
      id: string;
      status: string;
      origin: string;
      fileUrl: string | null;
      sizeBytes: number | null;
      createdAt: string;
    }>
  > {
    const rows = await this.dataExportRepository.find({
      where: {
        user: { id: userId },
        status: In([DataExportStatus.PENDING, DataExportStatus.COMPLETED, DataExportStatus.FAILED]),
      },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      origin: row.origin ?? 'manual',
      fileUrl: row.fileUrl,
      sizeBytes: row.sizeBytes == null ? null : Number(row.sizeBytes),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  /**
   * Resolve an archive's on-disk path for the authenticated owner.
   * Checks the private exports dir first, then the legacy `uploads/` location
   * (archives created before exports moved out of public static serving).
   */
  async getArchivePath(userId: string, exportId: string): Promise<string> {
    const row = await this.dataExportRepository.findOne({
      where: { id: exportId, user: { id: userId }, status: DataExportStatus.COMPLETED },
    });
    if (!row) throw new NotFoundException('Export not found');
    if (!row.fileUrl) {
      // Row exists but the file was pruned by retention.
      throw new NotFoundException('Archive has expired — run a new export.');
    }
    const candidates = [
      path.join(this.exportDir, `${row.id}.zip`),
      path.join(this.uploadDir, `${row.id}.zip`),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
    throw new NotFoundException('Archive has expired — run a new export.');
  }

  // --- Automatic export schedule -------------------------------------------

  async getSchedule(userId: string): Promise<ExportScheduleView> {
    const row = await this.scheduleRepository.findOne({
      where: { user: { id: userId } },
    });
    return this.toScheduleView(row);
  }

  async updateSchedule(
    userId: string,
    dto: { enabled?: boolean; intervalDays?: number }
  ): Promise<ExportScheduleView> {
    const existing = await this.scheduleRepository.findOne({
      where: { user: { id: userId } },
    });

    const intervalDays = dto.intervalDays ?? existing?.intervalDays ?? 30;
    if (!ALLOWED_EXPORT_INTERVALS.includes(intervalDays)) {
      throw new BadRequestException(
        `intervalDays must be one of: ${ALLOWED_EXPORT_INTERVALS.join(', ')}`
      );
    }

    const enabled = dto.enabled ?? existing?.enabled ?? false;
    const schedule =
      existing ??
      this.scheduleRepository.create({
        userId,
        user: { id: userId } as User,
      });

    schedule.enabled = enabled;
    schedule.intervalDays = intervalDays;
    // Predictable cadence: (re-)arming always starts counting from now, so
    // toggling or changing the interval schedules the first run one full
    // interval out — no surprise heavy job on enable.
    schedule.nextExportAt = enabled ? new Date(Date.now() + intervalDays * DAY_MS) : null;

    const saved = await this.scheduleRepository.save(schedule);
    return this.toScheduleView(saved);
  }

  private toScheduleView(row: ExportSchedule | null): ExportScheduleView {
    if (!row) {
      return {
        enabled: false,
        intervalDays: 30,
        lastExportAt: null,
        nextExportAt: null,
      };
    }
    return {
      enabled: row.enabled,
      intervalDays: row.intervalDays,
      lastExportAt: row.lastExportAt ? row.lastExportAt.toISOString() : null,
      nextExportAt: row.nextExportAt ? row.nextExportAt.toISOString() : null,
    };
  }

  /**
   * Hourly: produce an archive for every schedule that came due. A failed
   * export retries in one hour instead of burning the whole interval; a
   * banned user's schedule is switched off rather than retried forever.
   */
  @Cron(CronExpression.EVERY_HOUR, { name: 'data-export-scheduled' })
  async runScheduledExports(): Promise<void> {
    if (this.runningScheduledExports) return;
    this.runningScheduledExports = true;
    try {
      const due = await this.scheduleRepository.find({
        where: { enabled: true, nextExportAt: LessThanOrEqual(new Date()) },
        relations: ['user'],
      });

      for (const schedule of due) {
        const user = schedule.user;
        if (!user || user.banned) {
          schedule.enabled = false;
          schedule.nextExportAt = null;
          await this.scheduleRepository.save(schedule);
          continue;
        }
        try {
          await this.create(user, 'scheduled');
          schedule.lastExportAt = new Date();
          schedule.nextExportAt = new Date(Date.now() + schedule.intervalDays * DAY_MS);
        } catch (error) {
          this.logger.error(
            `Scheduled export failed for user ${user.id}`,
            error instanceof Error ? error.stack : undefined
          );
          schedule.nextExportAt = new Date(Date.now() + HOUR_MS);
        }
        await this.scheduleRepository.save(schedule);
      }
    } finally {
      this.runningScheduledExports = false;
    }
  }

  /**
   * Daily retention sweep: archives older than EXPORT_RETENTION_DAYS lose
   * their file (the history row survives with `fileUrl: null` so the UI can
   * say "expired"). Orphaned files inside the private exports dir are removed
   * too — that directory only ever contains export output, so nothing foreign
   * can be touched. `EXPORT_RETENTION_DAYS=0` disables pruning.
   */
  @Cron('0 3 * * *', { name: 'data-export-prune' })
  async pruneExpiredArchives(): Promise<{ archivesExpired: number; filesDeleted: number }> {
    const retentionDays = Number(this.configService.get('EXPORT_RETENTION_DAYS', 30));
    if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
      return { archivesExpired: 0, filesDeleted: 0 };
    }
    const cutoff = new Date(Date.now() - retentionDays * DAY_MS);

    const rows = await this.dataExportRepository.find({
      where: { status: DataExportStatus.COMPLETED, createdAt: LessThan(cutoff) },
    });

    let archivesExpired = 0;
    for (const row of rows) {
      if (!row.fileUrl) continue;
      const candidates = [
        path.join(this.exportDir, `${row.id}.zip`),
        path.join(this.exportDir, `${row.id}.json`),
        path.join(this.uploadDir, `${row.id}.zip`),
        path.join(this.uploadDir, `${row.id}.json`),
      ];
      for (const candidate of candidates) {
        await this.unlinkIfExists(candidate);
      }
      row.fileUrl = null;
      await this.dataExportRepository.save(row);
      archivesExpired++;
    }

    let filesDeleted = 0;
    try {
      const entries = await fs.promises.readdir(this.exportDir);
      for (const name of entries) {
        if (!name.endsWith('.zip') && !name.endsWith('.json')) continue;
        const target = path.join(this.exportDir, name);
        try {
          const stat = await fs.promises.stat(target);
          if (stat.mtimeMs < cutoff.getTime()) {
            await fs.promises.unlink(target);
            filesDeleted++;
          }
        } catch {
          // Raced with another writer/pruner — skip.
        }
      }
    } catch {
      // exports dir may not exist yet.
    }

    if (archivesExpired > 0 || filesDeleted > 0) {
      this.logger.log(
        `Export retention: expired ${archivesExpired} archive(s), removed ${filesDeleted} file(s)`
      );
    }
    return { archivesExpired, filesDeleted };
  }

  private async unlinkIfExists(target: string): Promise<void> {
    try {
      await fs.promises.unlink(target);
    } catch {
      // Already gone.
    }
  }

  // --- Deletion workflow (unchanged) ----------------------------------------

  async initiateDeletion(user: User) {
    // Schedule permanent deletion of all user data within 30 days (GDPR/CCPA requirement)
    const deletionDelay = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    // Create a deletion record
    const deletionRecord = this.dataExportRepository.create({
      user,
      status: DataExportStatus.DELETION_PENDING,
      scheduledDeletionAt: new Date(Date.now() + deletionDelay),
    });
    await this.dataExportRepository.save(deletionRecord);

    // Immediately soft-delete the user (mark as banned)
    const userRepository = this.dataExportRepository.manager.getRepository(User);
    await userRepository.update(user.id, {
      banned: true,
    });

    return {
      success: true,
      message: 'Account deletion scheduled. All data will be permanently removed within 30 days.',
    };
  }

  @Cron(CronExpression.EVERY_HOUR, { name: 'data-export-deletions' })
  async processScheduledDeletions(): Promise<void> {
    const dueRequests = await this.dataExportRepository.find({
      where: {
        status: DataExportStatus.DELETION_PENDING,
        scheduledDeletionAt: LessThanOrEqual(new Date()),
      },
      relations: ['user'],
    });

    for (const request of dueRequests) {
      try {
        await this.exportService.deleteAllUserData(request.user.id);
        await this.dataExportRepository.update(request.id, {
          status: DataExportStatus.DELETION_COMPLETED,
        });
        this.logger.log(`Completed scheduled deletion for user ${request.user.id}`);
      } catch (error) {
        this.logger.error(`Failed scheduled deletion for request ${request.id}`, error.stack);
        await this.dataExportRepository.update(request.id, {
          status: DataExportStatus.DELETION_FAILED,
        });
      }
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.exportQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const exportRequest = this.exportQueue.shift();

    try {
      await this.processExport(exportRequest);
    } catch (error) {
      this.logger.error(`Failed to process export request ${exportRequest.id}`, error.stack);
      exportRequest.status = DataExportStatus.FAILED;
      await this.dataExportRepository.save(exportRequest);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processExport(exportRequest: DataExport) {
    // Full portable payload: profile, posts, comments, DMs, articles, podcasts,
    // courses, enrollments, settings — via the richer ExportService.
    const userData = await this.exportService.exportUserData(exportRequest.user.id);

    const exportDir = this.exportDir;
    const uploadDir = this.uploadDir;
    await fs.promises.mkdir(exportDir, { recursive: true });

    // Staging JSON next to the archive (removed after the zip is finalized);
    // archiver reads it from disk, keeping the ESM-only archiver surface
    // identical to what the jest stand-in implements (file/pipe/finalize).
    const fileName = `${exportRequest.id}.json`;
    const filePath = path.join(exportDir, fileName);
    await fs.promises.writeFile(filePath, JSON.stringify(userData, null, 2), 'utf8');

    const zipFileName = `${exportRequest.id}.zip`;
    const zipFilePath = path.join(exportDir, zipFileName);
    const output = fs.createWriteStream(zipFilePath);
    const archive = (archiver as any).default('zip');

    await new Promise<void>((resolve, reject) => {
      output.once('close', resolve);
      output.once('error', reject);
      archive.once('error', reject);
      archive.pipe(output);
      archive.file(filePath, { name: 'data.json' });
      const mediaUrls = [
        userData.user?.avatar,
        userData.user?.header,
        ...userData.posts.flatMap((post) => post.media?.map((media) => media.url) ?? []),
        ...userData.stories.map((story) => story.mediaUrl),
        ...userData.messages.map((message) => message.mediaUrl),
        ...userData.podcasts.map((podcast) => podcast.audioUrl),
      ];
      for (const mediaUrl of mediaUrls) {
        if (!mediaUrl || !mediaUrl.startsWith('/uploads/')) continue;
        const mediaName = path.basename(mediaUrl.split('?')[0]);
        const mediaPath = path.join(uploadDir, mediaName);
        if (fs.existsSync(mediaPath)) archive.file(mediaPath, { name: `media/${mediaName}` });
      }
      void archive.finalize().catch(reject);
    });

    exportRequest.status = DataExportStatus.COMPLETED;
    // Authenticated, owner-only route — never a public static path.
    exportRequest.fileUrl = `/data-export/archive/${exportRequest.id}`;
    try {
      exportRequest.sizeBytes = (await fs.promises.stat(zipFilePath)).size;
    } catch {
      exportRequest.sizeBytes = null;
    }
    await this.dataExportRepository.save(exportRequest);
    await fs.promises.unlink(filePath);
  }
}
