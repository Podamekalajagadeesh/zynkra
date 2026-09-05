
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { DataExport, DataExportStatus } from './entities/data-export.entity';
import { ExportService } from './export.service';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);
  private readonly exportQueue: DataExport[] = [];
  private isProcessing = false;

  constructor(
    @InjectRepository(DataExport)
    private dataExportRepository: Repository<DataExport>,
    private readonly exportService: ExportService,
  ) {}

  async create(user: User): Promise<DataExport> {
    const exportRequest = this.dataExportRepository.create({
      user,
      status: DataExportStatus.PENDING,
    });

    const savedRequest = await this.dataExportRepository.save(exportRequest);
    try {
      await this.processExport(savedRequest);
      return savedRequest;
    } catch (error) {
      savedRequest.status = DataExportStatus.FAILED;
      await this.dataExportRepository.save(savedRequest);
      throw error;
    }
  }

  async getExport(user: User): Promise<DataExport | null> {
    return this.dataExportRepository.findOne({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

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

    return { success: true, message: 'Account deletion scheduled. All data will be permanently removed within 30 days.' };
  }

  @Cron(CronExpression.EVERY_HOUR)
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

    const fileName = `${exportRequest.id}.json`;
    const uploadDirectory = path.join(__dirname, '..', '..', 'uploads');
    await fs.promises.mkdir(uploadDirectory, { recursive: true });
    const filePath = path.join(uploadDirectory, fileName);
    await fs.promises.writeFile(filePath, JSON.stringify(userData, null, 2), 'utf8');

    const zipFileName = `${exportRequest.id}.zip`;
    const zipFilePath = path.join(uploadDirectory, zipFileName);
    const output = fs.createWriteStream(zipFilePath);
    const archive = (archiver as any).default('zip');

    await new Promise<void>((resolve, reject) => {
      output.once('close', resolve);
      output.once('error', reject);
      archive.once('error', reject);
      archive.pipe(output);
      archive.file(filePath, { name: 'data.json' });
      const mediaUrls = [
        ...userData.posts.flatMap((post) => post.media?.map((media) => media.url) ?? []),
        ...userData.stories.map((story) => story.mediaUrl),
        ...userData.messages.map((message) => message.mediaUrl),
        ...userData.podcasts.map((podcast) => podcast.audioUrl),
      ];
      for (const mediaUrl of mediaUrls) {
        if (!mediaUrl || !mediaUrl.startsWith('/uploads/')) continue;
        const mediaName = path.basename(mediaUrl.split('?')[0]);
        const mediaPath = path.join(uploadDirectory, mediaName);
        if (fs.existsSync(mediaPath)) archive.file(mediaPath, { name: `media/${mediaName}` });
      }
      void archive.finalize().catch(reject);
    });

    exportRequest.status = DataExportStatus.COMPLETED;
    exportRequest.fileUrl = `/uploads/${zipFileName}`;
    await this.dataExportRepository.save(exportRequest);
    await fs.promises.unlink(filePath);
  }
}