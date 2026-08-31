import { Controller, Get, Post, Query, Request, UseGuards, Param, Delete, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SecurityAuditService, CreateAuditLogDto } from './security-audit.service';
import {
  SecurityEventType,
  SecurityEventSeverity,
} from './entities/security-audit.entity';

@Controller('security-audit')
@UseGuards(JwtAuthGuard)
export class SecurityAuditController {
  constructor(private readonly securityAuditService: SecurityAuditService) {}

  @Post('log')
  async logEvent(@Request() req, @Body() body: Omit<CreateAuditLogDto, 'userId'>) {
    return this.securityAuditService.logEvent({
      ...body,
      userId: req.user.userId,
    });
  }

  @Get('me/logs')
  async getMyLogs(
    @Request() req,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('eventType') eventType?: SecurityEventType,
    @Query('severity') severity?: SecurityEventSeverity,
    @Query('fromDate') fromDate?: string,
  ) {
    return this.securityAuditService.getUserAuditLog(req.user.userId, {
      take: take ? +take : 50,
      skip: skip ? +skip : 0,
      eventType,
      severity,
      fromDate: fromDate ? new Date(fromDate) : undefined,
    });
  }

  @Get('me/summary')
  async getMySummary(@Request() req) {
    return this.securityAuditService.getSecuritySummary(req.user.userId);
  }

  @Get('me/export')
  async exportMyLogs(@Request() req) {
    return this.securityAuditService.exportUserAuditLog(req.user.userId);
  }

  @Delete('me/logs')
  async cleanupMyLogs(@Request() req, @Query('retentionDays') retentionDays?: string) {
    return this.securityAuditService.cleanupOldLogs(retentionDays ? +retentionDays : 365);
  }
}