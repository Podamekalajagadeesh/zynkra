import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  async triggerBackup() {
    return this.backupService.createBackup('manual');
  }
}
