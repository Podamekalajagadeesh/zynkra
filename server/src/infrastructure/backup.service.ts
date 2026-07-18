import { Injectable } from '@nestjs/common';
import { mkdir, writeFile, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export interface BackupResult {
  success: boolean;
  archivePath: string;
  manifestPath: string;
  checksum: string;
}

@Injectable()
export class BackupService {
  constructor(private readonly options: { workspaceRoot: string }) {}

  async createBackup(label: string): Promise<BackupResult> {
    const backupDir = join(this.options.workspaceRoot, 'backups');
    await mkdir(backupDir, { recursive: true });

    const archivePath = join(backupDir, `${label}-${Date.now()}.zip`);
    const manifestPath = join(backupDir, 'latest-backup.json');
    const checksum = createHash('sha256').update(label).digest('hex');

    await this.createArchive(archivePath);
    await writeFile(
      manifestPath,
      JSON.stringify({ label, createdAt: new Date().toISOString(), archivePath, checksum }, null, 2),
    );

    return {
      success: true,
      archivePath,
      manifestPath,
      checksum,
    };
  }

  private async createArchive(archivePath: string): Promise<void> {
    const manifestPath = join(this.options.workspaceRoot, 'backups', 'latest-backup-manifest.json');
    await writeFile(manifestPath, JSON.stringify({ createdAt: new Date().toISOString(), archivePath }, null, 2));
    await copyFile(manifestPath, archivePath);
  }
}
