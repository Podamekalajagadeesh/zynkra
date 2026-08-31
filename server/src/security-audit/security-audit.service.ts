import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { SecurityAuditLog, SecurityEventType, SecurityEventSeverity } from './entities/security-audit.entity';
import { User } from '../users/entities/user.entity';

export interface CreateAuditLogDto {
  userId: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  message: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(
    @InjectRepository(SecurityAuditLog)
    private readonly auditRepository: Repository<SecurityAuditLog>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async logEvent(dto: CreateAuditLogDto): Promise<SecurityAuditLog> {
    const entry = this.auditRepository.create({
      user: { id: dto.userId },
      eventType: dto.eventType,
      severity: dto.severity,
      message: dto.message,
      metadata: dto.metadata ?? {},
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });

    const saved = await this.auditRepository.save(entry);
    this.logger.log(`Security audit: [${dto.severity}] ${dto.eventType} - ${dto.message} (user: ${dto.userId})`);
    return saved;
  }

  async getUserAuditLog(
    userId: string,
    options: { take?: number; skip?: number; eventType?: SecurityEventType; severity?: SecurityEventSeverity; fromDate?: Date } = {},
  ): Promise<{ logs: SecurityAuditLog[]; total: number }> {
    const { take = 50, skip = 0, eventType, severity, fromDate } = options;

    const qb = this.auditRepository.createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .orderBy('log.createdAt', 'DESC')
      .take(take)
      .skip(skip);

    if (eventType) {
      qb.andWhere('log.eventType = :eventType', { eventType });
    }
    if (severity) {
      qb.andWhere('log.severity = :severity', { severity });
    }
    if (fromDate) {
      qb.andWhere('log.createdAt >= :fromDate', { fromDate });
    }

    const [logs, total] = await qb.getManyAndCount();
    return { logs, total };
  }

  async exportUserAuditLog(userId: string): Promise<SecurityAuditLog[]> {
    return this.auditRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getSecuritySummary(userId: string): Promise<{
    totalEvents: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    byEventType: Record<SecurityEventType, number>;
    recentCriticalEvents: SecurityAuditLog[];
  }> {
    const logs = await this.auditRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 1000,
    });

    const summary = {
      totalEvents: logs.length,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      byEventType: {} as Record<SecurityEventType, number>,
      recentCriticalEvents: logs
        .filter((l) => l.severity === SecurityEventSeverity.CRITICAL || l.severity === SecurityEventSeverity.HIGH)
        .slice(0, 10),
    };

    for (const log of logs) {
      switch (log.severity) {
        case SecurityEventSeverity.CRITICAL:
          summary.criticalCount++;
          break;
        case SecurityEventSeverity.HIGH:
          summary.highCount++;
          break;
        case SecurityEventSeverity.MEDIUM:
          summary.mediumCount++;
          break;
        case SecurityEventSeverity.LOW:
          summary.lowCount++;
          break;
      }

      summary.byEventType[log.eventType] = (summary.byEventType[log.eventType] || 0) + 1;
    }

    return summary;
  }

  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.auditRepository.delete({
      createdAt: LessThanOrEqual(cutoffDate),
      severity: SecurityEventSeverity.LOW,
    });

    this.logger.log(`Cleaned up ${result.affected} old low-severity audit logs older than ${retentionDays} days`);
    return result.affected ?? 0;
  }
}