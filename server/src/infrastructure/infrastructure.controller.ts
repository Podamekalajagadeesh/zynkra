import { Controller, Get } from '@nestjs/common';
import { InfrastructureService } from './infrastructure.service';
import { BackupService } from './backup.service';

@Controller('infrastructure')
export class InfrastructureController {
  constructor(
    private readonly infrastructureService: InfrastructureService,
    private readonly backupService: BackupService,
  ) {}

  @Get('health')
  getHealth() {
    return this.infrastructureService.getHealthSnapshot();
  }

  @Get('backup')
  async triggerBackup() {
    return this.backupService.createBackup('manual');
  }
}
