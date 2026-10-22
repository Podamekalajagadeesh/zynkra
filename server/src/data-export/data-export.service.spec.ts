/**
 * DataExportService — scheduled exports, private archive storage, retention.
 *
 * The zip pipeline runs against a spec-local `archiver` stand-in that actually
 * writes bytes (the repo-wide load-only stand-in never closes the stream, so
 * driving processExport with it would hang). Everything else — schedule CRUD,
 * the hourly due-processing cron, the nightly retention sweep, owner-only
 * archive resolution — is exercised against real files in a temp directory.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataExportService, ALLOWED_EXPORT_INTERVALS } from './data-export.service';
import { DataExport, DataExportStatus } from './entities/data-export.entity';

jest.mock('archiver', () => {
  const make = () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { EventEmitter } = require('events');
    const archive: any = new EventEmitter();
    let dest: any = null;
    archive.pipe = (d: any) => {
      dest = d;
      return d;
    };
    archive.file = () => archive;
    archive.append = () => archive;
    archive.directory = () => archive;
    archive.glob = () => archive;
    archive.pointer = () => 0;
    archive.finalize = async () => {
      if (dest) dest.end(Buffer.from('PK\u0003\u0004fake-zip-bytes'));
      return archive;
    };
    return archive;
  };
  return { __esModule: true, default: make };
});

type Repo = {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  update: jest.Mock;
  manager: { getRepository: jest.Mock };
};

const makeRepo = (): Repo => ({
  create: jest.fn((input: any) => input),
  save: jest.fn(async (input: any) => input),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  update: jest.fn().mockResolvedValue(undefined),
  manager: { getRepository: jest.fn() },
});

const exportPayload = () => ({
  user: { avatar: null, header: null },
  posts: [],
  stories: [],
  messages: [],
  podcasts: [],
});

let tmpRoot: string;

const makeService = (
  opts: {
    config?: Record<string, string | number>;
    exportRepo?: Repo;
    scheduleRepo?: Repo;
  } = {}
) => {
  const exportRepo = opts.exportRepo ?? makeRepo();
  const scheduleRepo = opts.scheduleRepo ?? makeRepo();
  const configMap: Record<string, any> = {
    EXPORT_DIR: path.join(tmpRoot, 'exports'),
    UPLOAD_DIR: path.join(tmpRoot, 'uploads'),
    EXPORT_RETENTION_DAYS: 30,
    ...(opts.config ?? {}),
  };
  const config = {
    get: jest.fn((key: string, fallback?: unknown) =>
      key in configMap ? configMap[key] : fallback
    ),
  };
  const exportService = {
    exportUserData: jest.fn().mockResolvedValue(exportPayload()),
    deleteAllUserData: jest.fn().mockResolvedValue(undefined),
  };
  fs.mkdirSync(configMap.EXPORT_DIR, { recursive: true });
  fs.mkdirSync(configMap.UPLOAD_DIR, { recursive: true });

  const service = new DataExportService(
    exportRepo as any,
    scheduleRepo as any,
    exportService as any,
    config as any
  );
  return { service, exportRepo, scheduleRepo, config, exportService, dirs: configMap };
};

let idCounter = 0;
const assignId = (input: any) => ({ id: `row-${++idCounter}`, ...input });
const isoNear = (ms: number, deltaMs = 5_000) =>
  Math.abs(new Date(ms).getTime() - Date.now()) < deltaMs;
const nearOffset = (actualMs: number, expectedOffsetMs: number, deltaMs = 5_000) =>
  Math.abs(actualMs - (Date.now() + expectedOffsetMs)) < deltaMs;

beforeEach(() => {
  idCounter = 0;
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zynkra-export-spec-'));
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('DataExportService manual export (private storage)', () => {
  it('writes the archive outside uploads/ and books it as an owner-only route', async () => {
    const { service, exportRepo, dirs } = makeService();
    exportRepo.create.mockImplementation(assignId);

    const row = await service.create({ id: 'user-1' } as any);

    expect(row.status).toBe(DataExportStatus.COMPLETED);
    expect(row.origin).toBe('manual');
    expect(row.fileUrl).toBe(`/data-export/archive/${row.id}`);
    // Private location — never under the publicly served uploads dir.
    expect(fs.existsSync(path.join(dirs.EXPORT_DIR, `${row.id}.zip`))).toBe(true);
    expect(fs.existsSync(path.join(dirs.UPLOAD_DIR, `${row.id}.zip`))).toBe(false);
    expect(Number(row.sizeBytes)).toBeGreaterThan(0);
    // Staging JSON is cleaned up once the zip is final.
    expect(fs.existsSync(path.join(dirs.EXPORT_DIR, `${row.id}.json`))).toBe(false);
  });

  it('marks the row FAILED and re-throws when export generation blows up', async () => {
    const { service, exportRepo, exportService } = makeService();
    exportRepo.create.mockImplementation(assignId);
    exportService.exportUserData.mockRejectedValue(new Error('db down'));

    await expect(service.create({ id: 'user-1' } as any)).rejects.toThrow('db down');

    const saved = exportRepo.save.mock.calls.map((c) => c[0]);
    expect(saved.at(-1).status).toBe(DataExportStatus.FAILED);
    expect(saved.at(-1).origin).toBe('manual');
  });

  it('serves the archive only to its owner', async () => {
    const { service, exportRepo, dirs } = makeService();
    const zipPath = path.join(dirs.EXPORT_DIR, 'exp-1.zip');
    fs.writeFileSync(zipPath, 'zip');
    exportRepo.findOne.mockImplementation((args: any) =>
      Promise.resolve(
        args.where.id === 'exp-1' && args.where.user.id === 'owner'
          ? {
              id: 'exp-1',
              status: DataExportStatus.COMPLETED,
              fileUrl: '/data-export/archive/exp-1',
            }
          : null
      )
    );

    await expect(service.getArchivePath('owner', 'exp-1')).resolves.toBe(zipPath);
    await expect(service.getArchivePath('stranger', 'exp-1')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('falls back to the legacy uploads location for pre-upgrade archives', async () => {
    const { service, exportRepo, dirs } = makeService();
    const legacyPath = path.join(dirs.UPLOAD_DIR, 'exp-legacy.zip');
    fs.writeFileSync(legacyPath, 'zip');
    exportRepo.findOne.mockResolvedValue({
      id: 'exp-legacy',
      status: DataExportStatus.COMPLETED,
      fileUrl: '/uploads/exp-legacy.zip',
    });

    await expect(service.getArchivePath('owner', 'exp-legacy')).resolves.toBe(legacyPath);
  });

  it('reports a pruned archive as gone', async () => {
    const { service, exportRepo } = makeService();
    exportRepo.findOne.mockResolvedValue({
      id: 'exp-gone',
      status: DataExportStatus.COMPLETED,
      fileUrl: null,
    });

    await expect(service.getArchivePath('owner', 'exp-gone')).rejects.toMatchObject({
      message: expect.stringMatching(/expired/i),
    });
  });
});

describe('DataExportService schedule', () => {
  it('returns a disabled default when the user never configured one', async () => {
    const { service } = makeService();
    await expect(service.getSchedule('user-1')).resolves.toEqual({
      enabled: false,
      intervalDays: 30,
      lastExportAt: null,
      nextExportAt: null,
    });
  });

  it('rejects intervals outside the allowed set', async () => {
    const { service } = makeService();
    await expect(
      service.updateSchedule('user-1', { enabled: true, intervalDays: 3 })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ALLOWED_EXPORT_INTERVALS).toEqual([7, 14, 30, 90]);
  });

  it('arms the first run one full interval out when enabled', async () => {
    const { service, scheduleRepo } = makeService();
    scheduleRepo.create.mockImplementation(assignId);

    const view = await service.updateSchedule('user-1', {
      enabled: true,
      intervalDays: 7,
    });

    expect(view.enabled).toBe(true);
    expect(view.intervalDays).toBe(7);
    expect(isoNear(new Date(view.nextExportAt!).getTime() - 7 * 86_400_000)).toBe(true);
    const saved = scheduleRepo.save.mock.calls.at(-1)[0];
    expect(saved.user).toEqual({ id: 'user-1' });
    expect(saved.userId).toBe('user-1');
    expect(saved.enabled).toBe(true);
  });

  it('clears nextExportAt when disabled and keeps history', async () => {
    const { service, scheduleRepo } = makeService();
    scheduleRepo.findOne.mockResolvedValue({
      id: 'sched-1',
      user: { id: 'user-1' },
      enabled: true,
      intervalDays: 14,
      lastExportAt: new Date('2026-01-01T00:00:00Z'),
      nextExportAt: new Date('2026-01-15T00:00:00Z'),
    });

    const view = await service.updateSchedule('user-1', { enabled: false });

    expect(view.enabled).toBe(false);
    expect(view.nextExportAt).toBeNull();
    expect(view.lastExportAt).toBe('2026-01-01T00:00:00.000Z');
    expect(view.intervalDays).toBe(14);
  });
});

describe('DataExportService.runScheduledExports (hourly cron)', () => {
  const dueSchedule = (over: Partial<any> = {}) => ({
    id: 'sched-1',
    user: { id: 'user-1', banned: false },
    enabled: true,
    intervalDays: 30,
    lastExportAt: null,
    nextExportAt: new Date(Date.now() - 60_000),
    ...over,
  });

  it('exports due schedules as "scheduled" and advances the cadence', async () => {
    const { service, scheduleRepo } = makeService();
    const row = dueSchedule();
    scheduleRepo.find.mockResolvedValue([row]);
    const createSpy = jest.spyOn(service, 'create').mockResolvedValue({ id: 'exp-9' } as any);

    await service.runScheduledExports();

    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }), 'scheduled');
    expect(row.lastExportAt).toBeInstanceOf(Date);
    expect(nearOffset(new Date(row.nextExportAt!).getTime(), 30 * 86_400_000)).toBe(true);
    expect(scheduleRepo.save).toHaveBeenCalledWith(row);
  });

  it('disables the schedule of a banned user instead of exporting', async () => {
    const { service, scheduleRepo } = makeService();
    const row = dueSchedule({ user: { id: 'user-1', banned: true } });
    scheduleRepo.find.mockResolvedValue([row]);
    const createSpy = jest.spyOn(service, 'create');

    await service.runScheduledExports();

    expect(createSpy).not.toHaveBeenCalled();
    expect(row.enabled).toBe(false);
    expect(row.nextExportAt).toBeNull();
    expect(scheduleRepo.save).toHaveBeenCalledWith(row);
  });

  it('retries a failed export in one hour rather than losing the interval', async () => {
    const { service, scheduleRepo } = makeService();
    const row = dueSchedule();
    scheduleRepo.find.mockResolvedValue([row]);
    jest.spyOn(service, 'create').mockRejectedValue(new Error('boom'));

    await service.runScheduledExports();

    const retryAt = new Date(row.nextExportAt!).getTime();
    expect(nearOffset(retryAt, 3_600_000)).toBe(true);
    expect(row.lastExportAt).toBeNull();
    expect(scheduleRepo.save).toHaveBeenCalledWith(row);
  });
});

describe('DataExportService.pruneExpiredArchives (retention)', () => {
  it('expires old archives: file removed, history row keeps fileUrl null', async () => {
    const { service, exportRepo, dirs } = makeService();
    const zipPath = path.join(dirs.EXPORT_DIR, 'old-row.zip');
    fs.writeFileSync(zipPath, 'zip');
    const oldRow = {
      id: 'old-row',
      status: DataExportStatus.COMPLETED,
      fileUrl: '/data-export/archive/old-row',
      createdAt: new Date(Date.now() - 40 * 86_400_000),
    };
    exportRepo.find.mockResolvedValue([oldRow]);

    const result = await service.pruneExpiredArchives();

    expect(result.archivesExpired).toBe(1);
    expect(fs.existsSync(zipPath)).toBe(false);
    expect(oldRow.fileUrl).toBeNull();
    expect(exportRepo.save).toHaveBeenCalledWith(oldRow);
  });

  it('removes legacy uploads archives for expired rows but never foreign media', async () => {
    const { service, exportRepo, dirs } = makeService();
    const legacyZip = path.join(dirs.UPLOAD_DIR, 'legacy-row.zip');
    const mediaFile = path.join(dirs.UPLOAD_DIR, 'photo.jpg');
    fs.writeFileSync(legacyZip, 'zip');
    fs.writeFileSync(mediaFile, 'jpeg');
    exportRepo.find.mockResolvedValue([
      {
        id: 'legacy-row',
        status: DataExportStatus.COMPLETED,
        fileUrl: '/uploads/legacy-row.zip',
        createdAt: new Date(Date.now() - 40 * 86_400_000),
      },
    ]);

    await service.pruneExpiredArchives();

    expect(fs.existsSync(legacyZip)).toBe(false);
    expect(fs.existsSync(mediaFile)).toBe(true);
  });

  it('sweeps stale orphan files inside the private exports dir only', async () => {
    const { service, exportRepo, dirs } = makeService();
    exportRepo.find.mockResolvedValue([]);
    const staleOrphan = path.join(dirs.EXPORT_DIR, 'orphan.zip');
    const freshArchive = path.join(dirs.EXPORT_DIR, 'fresh.zip');
    fs.writeFileSync(staleOrphan, 'zip');
    fs.writeFileSync(freshArchive, 'zip');
    const old = new Date(Date.now() - 40 * 86_400_000);
    fs.utimesSync(staleOrphan, old, old);

    const result = await service.pruneExpiredArchives();

    expect(fs.existsSync(staleOrphan)).toBe(false);
    expect(fs.existsSync(freshArchive)).toBe(true);
    expect(result.filesDeleted).toBe(1);
  });

  it('does nothing when retention is disabled (0 days)', async () => {
    const { service, exportRepo, dirs } = makeService({
      config: { EXPORT_RETENTION_DAYS: 0 },
    });
    exportRepo.find.mockResolvedValue([]);
    const keep = path.join(dirs.EXPORT_DIR, 'keep.zip');
    fs.writeFileSync(keep, 'zip');
    const old = new Date(Date.now() - 400 * 86_400_000);
    fs.utimesSync(keep, old, old);

    const result = await service.pruneExpiredArchives();

    expect(result).toEqual({ archivesExpired: 0, filesDeleted: 0 });
    expect(fs.existsSync(keep)).toBe(true);
    expect(exportRepo.find).not.toHaveBeenCalled();
  });
});

describe('DataExportService.listHistory', () => {
  it('lists recent exports without deletion-workflow rows', async () => {
    const { service, exportRepo } = makeService();
    exportRepo.find.mockResolvedValue([
      {
        id: 'exp-1',
        status: DataExportStatus.COMPLETED,
        origin: 'scheduled',
        fileUrl: '/data-export/archive/exp-1',
        sizeBytes: '12345',
        createdAt: new Date('2026-02-01T00:00:00Z'),
      },
    ]);

    const history = await service.listHistory('user-1');

    const where = exportRepo.find.mock.calls[0][0].where;
    expect(where.status.type).toBe('in');
    expect(where.status.value).toEqual([
      DataExportStatus.PENDING,
      DataExportStatus.COMPLETED,
      DataExportStatus.FAILED,
    ]);
    expect(where.status.value).not.toContain(DataExportStatus.DELETION_PENDING);
    expect(history).toEqual([
      {
        id: 'exp-1',
        status: 'completed',
        origin: 'scheduled',
        fileUrl: '/data-export/archive/exp-1',
        sizeBytes: 12345,
        createdAt: '2026-02-01T00:00:00.000Z',
      },
    ]);
  });
});
