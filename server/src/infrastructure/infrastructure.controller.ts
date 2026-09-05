import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { InfrastructureService } from './infrastructure.service';
import { BackupService } from './backup.service';
import { CreatePlatformIncidentDto, CreatePlatformMaintenanceDto, UpdatePlatformIncidentDto, UpdatePlatformMaintenanceDto } from './dto/platform-status.dto';

@Controller('infrastructure')
export class InfrastructureController {
  constructor(
    private readonly infrastructureService: InfrastructureService,
    private readonly backupService: BackupService,
  ) {}

  @Get('health')
  async getHealth() {
    return this.infrastructureService.getStatusPage();
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getStatus() {
    return this.infrastructureService.getStatusPage();
  }

  @Get('history')
  async getHistory() {
    return this.infrastructureService.getHistory();
  }

  @Post('incidents')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createIncident(@Body() body: CreatePlatformIncidentDto) {
    return this.infrastructureService.createIncident(body);
  }

  @Patch('incidents/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateIncident(@Param('id') id: string, @Body() body: UpdatePlatformIncidentDto) {
    return this.infrastructureService.updateIncident(id, body);
  }

  @Post('maintenance')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createMaintenance(@Body() body: CreatePlatformMaintenanceDto) {
    return this.infrastructureService.createMaintenance(body);
  }

  @Patch('maintenance/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateMaintenance(@Param('id') id: string, @Body() body: UpdatePlatformMaintenanceDto) {
    return this.infrastructureService.updateMaintenance(id, body);
  }

  @Get('backup')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async triggerBackup() {
    return this.backupService.createBackup('manual');
  }
}
