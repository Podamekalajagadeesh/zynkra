import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BackupService } from './backup.service';
import { InfrastructureService } from './infrastructure.service';

describe('InfrastructureService', () => {
  it('creates a manifest and archive for backups', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'zynkra-backup-'));

    try {
      const backupService = new BackupService({ workspaceRoot: tempDir } as any);
      const result = await backupService.createBackup('demo');

      expect(result.success).toBe(true);
      expect(result.archivePath.endsWith('.zip')).toBe(true);

      const manifest = JSON.parse(await readFile(join(tempDir, 'backups', 'latest-backup.json'), 'utf8'));
      expect(manifest.label).toBe('demo');
      expect(manifest.createdAt).toBeDefined();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('reports a healthy status snapshot when infrastructure services are configured', async () => {
    const configService = {
      get: (key: string, defaultValue?: string) => {
        const values: Record<string, string> = {
          NODE_ENV: 'test',
          REDIS_HOST: '127.0.0.1',
          REDIS_PORT: '6379',
          CDN_BASE_URL: 'https://cdn.example.com',
        };
        return values[key] ?? defaultValue ?? '';
      },
    };

    const service = new InfrastructureService(configService as any, {
      query: async () => [{ '?column?': 1 }],
    } as any, {
      create: (value: any) => value,
      save: async (value: any) => value,
    } as any, {} as any, {} as any);
    const snapshot = await service.getHealthSnapshot();

    expect(snapshot.status).toBe('degraded');
    expect(snapshot.services.api.status).toBe('operational');
    expect(snapshot.services.database.status).toBe('operational');
    expect(snapshot.services.redis.status).toBe('operational');
    expect(snapshot.services.cdn.status).toBe('operational');
  });
});
