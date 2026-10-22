import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, IsNull, Repository } from 'typeorm';
import { SecurityAuditService } from '../../security-audit/security-audit.service';
import {
  SecurityAuditLog as SecurityAuditLogEntity,
  SecurityEventType,
  SecurityEventSeverity,
} from '../../security-audit/entities/security-audit.entity';
import { User } from '../../users/entities/user.entity';
import { Authenticator } from '../../auth/entities/authenticator.entity';
import { LoginSession } from '../../auth/entities/login-session.entity';
import { isValidIpOrCidr } from '../../common/ip';

export interface SecuritySetting {
  accountId: string;
  twoFactorAuthentication: boolean;
  biometricAuthentication: boolean;
  passkeysEnabled: boolean;
  recoveryCodesEnabled: boolean;
  loginApprovalsEnabled: boolean;
  suspiciousLoginAlertsEnabled: boolean;
  deviceManagementEnabled: boolean;
  sessionManagementEnabled: boolean;
  accountRecoveryEnabled: boolean;
  securityCenterEnabled: boolean;
  loginNotifications: boolean;
  unknownLocationAlerts: boolean;
  sessionTimeout: boolean;
  sessionTimeoutMinutes: number;
  securityLevel: 'standard' | 'enhanced' | 'maximum';
  verifyNewDevices: boolean;
  allowRememberDevice: boolean;
  trustedIpAddresses: string[];
  updatedAt: Date;
  lastModifiedBy?: string;
}

export interface SecurityAuditLog {
  eventId: string;
  accountId: string;
  eventType: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  status: 'success' | 'failed' | 'warning';
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Controls this service still tracks in an in-process `Map` and that therefore
 * do not survive a restart, are not shared across instances, and are enforced
 * by nothing. They are reported rather than presented as real protection —
 * see the note on `getSecurityRiskAssessment`.
 */
export const NOT_ENFORCED_CONTROLS = [
  'biometricAuthentication (the /auth/biometric/* surface was removed; use passkeys)',
  // Note: the per-account `sessionTimeout`/`sessionTimeoutMinutes` values here
  // are still not enforced. There is now a real server-side idle timeout, but it
  // is a single deployment-wide setting (SESSION_IDLE_TIMEOUT_MINUTES), not a
  // per-user preference.
  'sessionTimeout / sessionTimeoutMinutes (per-user values are not enforced; the deployment-wide SESSION_IDLE_TIMEOUT_MINUTES is)',
  'verifyNewDevices',
  'loginApprovalsEnabled',
  'securityLevel',
] as const;

@Injectable()
export class SecuritySettingsService {
  private readonly logger = new Logger(SecuritySettingsService.name);
  private readonly securitySettings = new Map<string, SecuritySetting>();
  private readonly securityLogs = new Map<string, SecurityAuditLog[]>();

  constructor(
    private readonly securityAuditService?: SecurityAuditService,
    @InjectRepository(User) private readonly usersRepository?: Repository<User>,
    @InjectRepository(Authenticator)
    private readonly authenticatorsRepository?: Repository<Authenticator>,
    @InjectRepository(SecurityAuditLogEntity)
    private readonly auditRepository?: Repository<SecurityAuditLogEntity>,
    @InjectRepository(LoginSession)
    private readonly loginSessionsRepository?: Repository<LoginSession>
  ) {}

  private mapEventType(eventType: string): SecurityEventType {
    const normalized = eventType.toLowerCase();

    switch (normalized) {
      case '2fa_enabled':
      case 'totp_enabled':
        return SecurityEventType.TOTP_ENABLED;
      case '2fa_disabled':
      case 'totp_disabled':
        return SecurityEventType.TOTP_DISABLED;
      case 'security_settings_updated':
      case 'security_settings_change':
        return SecurityEventType.PRIVACY_SETTINGS_CHANGED;
      case 'trusted_ip_added':
        return SecurityEventType.DEVICE_REGISTERED;
      case 'trusted_ip_removed':
        return SecurityEventType.DEVICE_REVOKED;
      case 'biometric_enabled':
        return SecurityEventType.PASSKEY_REGISTERED;
      case 'login_approval_requested':
        return SecurityEventType.SESSION_CREATED;
      default:
        return SecurityEventType.ADMIN_ACCOUNT_MODIFIED;
    }
  }

  private mapSeverity(status: 'success' | 'failed' | 'warning'): SecurityEventSeverity {
    switch (status) {
      case 'failed':
        return SecurityEventSeverity.HIGH;
      case 'warning':
        return SecurityEventSeverity.MEDIUM;
      case 'success':
      default:
        return SecurityEventSeverity.LOW;
    }
  }

  /**
   * Get security settings for an account.
   *
   * ⚠️  The returned object mixes two very different things:
   *
   *  - Fields that reflect **real persisted state** — `twoFactorAuthentication`,
   *    `recoveryCodesEnabled`, `emailVerified` are read from the `User` row, and
   *    `passkeysEnabled` is true when the user has registered at least one
   *    authenticator.
   *  - Fields that are **held only in this service's in-process Map** and are
   *    enforced by nothing: `sessionTimeout`, `verifyNewDevices`,
   *    `trustedIpAddresses`, `loginApprovalsEnabled`, `securityLevel`, and
   *    `biometricAuthentication`. They do not survive a restart, are not shared
   *    across instances, and no request path consults them.
   *
   * `notEnforced` names the second group so a caller can tell the difference.
   * Setting a flag in the second group does not make the account safer.
   */
  async getSecuritySettings(
    accountId: string
  ): Promise<SecuritySetting & { notEnforced: readonly string[] }> {
    const stored = this.securitySettings.get(accountId) ?? this.createDefaultSettings(accountId);
    this.securitySettings.set(accountId, stored);

    // Overlay the real state so the response is not lying about 2FA.
    const user = await this.usersRepository?.findOne({ where: { id: accountId } });
    const passkeyCount = user
      ? await this.authenticatorsRepository?.count({ where: { user: { id: accountId } } })
      : undefined;

    return {
      ...stored,
      twoFactorAuthentication: user?.twoFactorEnabled ?? stored.twoFactorAuthentication,
      recoveryCodesEnabled: Boolean(user?.recoveryCodeHashes?.length),
      passkeysEnabled: (passkeyCount ?? 0) > 0,
      trustedIpAddresses: user?.trustedIpAddresses ?? stored.trustedIpAddresses,
      notEnforced: NOT_ENFORCED_CONTROLS,
    };
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(
    accountId: string,
    updates: Partial<SecuritySetting>,
    modifiedBy?: string
  ): Promise<SecuritySetting> {
    let settings = this.securitySettings.get(accountId);

    if (!settings) {
      settings = this.createDefaultSettings(accountId);
    }

    // Validate security level consistency
    if (updates.securityLevel === 'maximum' && !updates.twoFactorAuthentication) {
      throw new BadRequestException('Maximum security level requires 2FA to be enabled');
    }

    // Update settings
    if (updates.twoFactorAuthentication !== undefined)
      settings.twoFactorAuthentication = updates.twoFactorAuthentication;
    if (updates.biometricAuthentication !== undefined)
      settings.biometricAuthentication = updates.biometricAuthentication;
    if (updates.passkeysEnabled !== undefined) settings.passkeysEnabled = updates.passkeysEnabled;
    if (updates.recoveryCodesEnabled !== undefined)
      settings.recoveryCodesEnabled = updates.recoveryCodesEnabled;
    if (updates.loginApprovalsEnabled !== undefined)
      settings.loginApprovalsEnabled = updates.loginApprovalsEnabled;
    if (updates.suspiciousLoginAlertsEnabled !== undefined)
      settings.suspiciousLoginAlertsEnabled = updates.suspiciousLoginAlertsEnabled;
    if (updates.deviceManagementEnabled !== undefined)
      settings.deviceManagementEnabled = updates.deviceManagementEnabled;
    if (updates.sessionManagementEnabled !== undefined)
      settings.sessionManagementEnabled = updates.sessionManagementEnabled;
    if (updates.accountRecoveryEnabled !== undefined)
      settings.accountRecoveryEnabled = updates.accountRecoveryEnabled;
    if (updates.securityCenterEnabled !== undefined)
      settings.securityCenterEnabled = updates.securityCenterEnabled;
    if (updates.loginNotifications !== undefined)
      settings.loginNotifications = updates.loginNotifications;
    if (updates.unknownLocationAlerts !== undefined)
      settings.unknownLocationAlerts = updates.unknownLocationAlerts;
    if (updates.sessionTimeout !== undefined) settings.sessionTimeout = updates.sessionTimeout;
    if (updates.sessionTimeoutMinutes !== undefined) {
      if (updates.sessionTimeoutMinutes < 5 || updates.sessionTimeoutMinutes > 1440) {
        throw new BadRequestException('Session timeout must be between 5 and 1440 minutes');
      }
      settings.sessionTimeoutMinutes = updates.sessionTimeoutMinutes;
    }
    if (updates.securityLevel !== undefined) settings.securityLevel = updates.securityLevel;
    if (updates.verifyNewDevices !== undefined)
      settings.verifyNewDevices = updates.verifyNewDevices;
    if (updates.allowRememberDevice !== undefined)
      settings.allowRememberDevice = updates.allowRememberDevice;
    if (updates.trustedIpAddresses !== undefined)
      settings.trustedIpAddresses = updates.trustedIpAddresses;

    settings.updatedAt = new Date();
    settings.lastModifiedBy = modifiedBy;

    this.securitySettings.set(accountId, settings);

    // Log the change
    this.recordSecurityAuditLog(
      accountId,
      'security_settings_updated',
      'success',
      'Security settings updated',
      {
        changes: updates,
        modifiedBy,
      }
    );

    return settings;
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFA(accountId: string): Promise<{ success: boolean; message: string }> {
    const settings = await this.getSecuritySettings(accountId);
    settings.twoFactorAuthentication = true;
    settings.updatedAt = new Date();

    this.securitySettings.set(accountId, settings);
    this.recordSecurityAuditLog(accountId, '2fa_enabled', 'success', '2FA enabled');

    return { success: true, message: 'Two-factor authentication enabled' };
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFA(accountId: string): Promise<{ success: boolean; message: string }> {
    const settings = await this.getSecuritySettings(accountId);

    if (settings.securityLevel === 'maximum') {
      throw new BadRequestException('Cannot disable 2FA with maximum security level');
    }

    settings.twoFactorAuthentication = false;
    settings.updatedAt = new Date();

    this.securitySettings.set(accountId, settings);
    this.recordSecurityAuditLog(accountId, '2fa_disabled', 'success', '2FA disabled');

    return { success: true, message: 'Two-factor authentication disabled' };
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometricAuth(accountId: string): Promise<{ success: boolean; message: string }> {
    const settings = await this.getSecuritySettings(accountId);
    settings.biometricAuthentication = true;
    settings.updatedAt = new Date();

    this.securitySettings.set(accountId, settings);
    this.recordSecurityAuditLog(
      accountId,
      'biometric_enabled',
      'success',
      'Biometric authentication enabled'
    );

    return { success: true, message: 'Biometric authentication enabled' };
  }

  /**
   * Add a trusted IP address.
   *
   * Persisted to `User.trustedIpAddresses`, not to this service's in-process
   * map. A sign-in from a trusted address skips the new-device /
   * suspicious-login prompt (`AuthService.isTrustedIp`). Previously the list was
   * memory-only and consulted by nothing, so this endpoint was cosmetic.
   */
  async addTrustedIpAddress(
    accountId: string,
    ipAddress: string
  ): Promise<{ success: boolean; trustedIps: string[] }> {
    if (!this.isValidIpAddress(ipAddress)) {
      throw new BadRequestException('Invalid IP address format');
    }

    const user = await this.usersRepository?.findOne({ where: { id: accountId } });
    if (!user) {
      throw new NotFoundException('Account not found');
    }

    const current = user.trustedIpAddresses ?? [];
    if (!current.includes(ipAddress)) {
      user.trustedIpAddresses = [...current, ipAddress];
      await this.usersRepository!.save(user);
      this.recordSecurityAuditLog(
        accountId,
        'trusted_ip_added',
        'success',
        `Trusted IP added: ${ipAddress}`,
        { ipAddress }
      );
    }

    return { success: true, trustedIps: user.trustedIpAddresses ?? [] };
  }

  /** Remove a trusted IP address. */
  async removeTrustedIpAddress(
    accountId: string,
    ipAddress: string
  ): Promise<{ success: boolean; trustedIps: string[] }> {
    const user = await this.usersRepository?.findOne({ where: { id: accountId } });
    if (!user) {
      throw new NotFoundException('Account not found');
    }

    const current = user.trustedIpAddresses ?? [];
    if (current.includes(ipAddress)) {
      user.trustedIpAddresses = current.filter((ip) => ip !== ipAddress);
      await this.usersRepository!.save(user);
      this.recordSecurityAuditLog(
        accountId,
        'trusted_ip_removed',
        'success',
        `Trusted IP removed: ${ipAddress}`,
        { ipAddress }
      );
    }

    return { success: true, trustedIps: user.trustedIpAddresses ?? [] };
  }

  private mapAuditStatus(severity: SecurityEventSeverity): 'success' | 'failed' | 'warning' {
    switch (severity) {
      case SecurityEventSeverity.CRITICAL:
      case SecurityEventSeverity.HIGH:
        return 'failed';
      case SecurityEventSeverity.MEDIUM:
        return 'warning';
      case SecurityEventSeverity.LOW:
      default:
        return 'success';
    }
  }

  /**
   * Get security audit log
   */
  async getSecurityAuditLog(accountId: string, limit = 100): Promise<SecurityAuditLog[]> {
    if (this.securityAuditService) {
      try {
        const result = await this.securityAuditService.getUserAuditLog(accountId, {
          take: limit,
          skip: 0,
        });

        return (result.logs ?? []).map((log) => ({
          eventId: log.id,
          accountId: log.userId ?? accountId,
          eventType: log.eventType,
          timestamp: log.createdAt,
          ipAddress: log.ipAddress ?? undefined,
          userAgent: log.userAgent ?? undefined,
          location: (log.metadata as Record<string, any> | undefined)?.location ?? undefined,
          status: this.mapAuditStatus(log.severity),
          description: log.message,
          metadata: log.metadata ?? undefined,
        }));
      } catch (error) {
        this.logger.warn(
          `Failed to load persisted audit log for ${accountId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    const logs = this.securityLogs.get(accountId) || [];
    return logs.slice(-limit).reverse();
  }

  /**
   * Record a security audit log entry
   */
  async recordSecurityAuditLog(
    accountId: string,
    eventType: string,
    status: 'success' | 'failed' | 'warning',
    description: string,
    metadata?: Record<string, any>
  ): Promise<SecurityAuditLog> {
    const log: SecurityAuditLog = {
      eventId: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      accountId,
      eventType,
      timestamp: new Date(),
      status,
      description,
      metadata,
    };

    if (!this.securityLogs.has(accountId)) {
      this.securityLogs.set(accountId, []);
    }

    const logs = this.securityLogs.get(accountId)!;
    logs.push(log);

    if (logs.length > 1000) {
      logs.shift();
    }

    try {
      if (this.securityAuditService) {
        await this.securityAuditService.logEvent({
          userId: accountId,
          eventType: this.mapEventType(eventType),
          severity: this.mapSeverity(status),
          message: description,
          metadata,
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to persist security audit log for ${accountId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    this.logger.log(`Security audit: ${eventType} for account ${accountId} - ${description}`);

    return log;
  }

  /**
   * Clear old logs (older than specified days)
   */
  async clearOldAuditLogs(
    accountId: string,
    olderThanDays: number
  ): Promise<{ success: boolean; clearedCount: number }> {
    if (this.securityAuditService) {
      try {
        const cleared = await this.securityAuditService.cleanupOldLogs(olderThanDays);
        const logs = this.securityLogs.get(accountId) || [];
        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
        const filtered = logs.filter((log) => log.timestamp >= cutoffDate);
        if (filtered.length === 0) {
          this.securityLogs.delete(accountId);
        } else {
          this.securityLogs.set(accountId, filtered);
        }

        this.logger.log(`Cleared ${cleared} persisted audit logs for account ${accountId}`);
        return { success: true, clearedCount: cleared };
      } catch (error) {
        this.logger.warn(
          `Failed to clear persisted audit logs for ${accountId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    const logs = this.securityLogs.get(accountId) || [];
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const originalLength = logs.length;
    const filtered = logs.filter((log) => log.timestamp >= cutoffDate);

    if (filtered.length > 0) {
      this.securityLogs.set(accountId, filtered);
    } else {
      this.securityLogs.delete(accountId);
    }

    const clearedCount = originalLength - filtered.length;

    this.logger.log(`Cleared ${clearedCount} old audit logs for account ${accountId}`);

    return { success: true, clearedCount };
  }

  /**
   * Export security audit log
   */
  async exportAuditLog(
    accountId: string
  ): Promise<{ accountId: string; exportUrl: string; logCount: number; generatedAt: string }> {
    if (this.securityAuditService) {
      try {
        const logs = await this.securityAuditService.exportUserAuditLog(accountId);
        const exportUrl = `/exports/audit-log-${accountId}-${Date.now()}.json`;
        return {
          accountId,
          exportUrl,
          logCount: logs.length,
          generatedAt: new Date().toISOString(),
        };
      } catch (error) {
        this.logger.warn(
          `Failed to export persisted audit log for ${accountId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    const logs = this.securityLogs.get(accountId) || [];

    // In production, generate actual file and upload to storage
    const exportUrl = `/exports/audit-log-${accountId}-${Date.now()}.json`;

    return {
      accountId,
      exportUrl,
      logCount: logs.length,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Set security level
   */
  async setSecurityLevel(
    accountId: string,
    level: 'standard' | 'enhanced' | 'maximum'
  ): Promise<SecuritySetting> {
    const settings = await this.getSecuritySettings(accountId);

    if (level === 'maximum' && !settings.twoFactorAuthentication) {
      throw new BadRequestException('Cannot set maximum security level without 2FA enabled');
    }

    settings.securityLevel = level;
    settings.updatedAt = new Date();

    this.securitySettings.set(accountId, settings);

    this.recordSecurityAuditLog(
      accountId,
      'security_level_changed',
      'success',
      `Security level changed to ${level}`
    );

    return settings;
  }

  /**
   * Security posture, computed from **real persisted state**.
   *
   * This previously read `settings.twoFactorAuthentication` from the in-process
   * map above, which nothing outside this file ever wrote to — while the actual
   * 2FA state lives on the `User` record. The result was an actively harmful
   * false negative: a user who *had* enabled 2FA was told to enable it and lost
   * 25 risk points, because the map was empty. Same for passkeys (counted from
   * `authenticators` now) and failed logins (counted from `security_audit_logs`
   * now, instead of a `Map` that was always empty).
   *
   * Only signals with a real backing store are scored. Anything this service
   * still tracks in memory is reported under `notEnforced` rather than being
   * presented as a real control.
   */
  async getSecurityRiskAssessment(accountId: string): Promise<{
    accountId: string;
    riskLevel: 'low' | 'medium' | 'high';
    score: number;
    recommendations: string[];
    signals: Record<string, boolean | number>;
    notEnforced: readonly string[];
  }> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [user, passkeyCount, failedLogins, liveSessions] = await Promise.all([
      this.usersRepository?.findOne({ where: { id: accountId } }) ?? Promise.resolve(null),
      this.authenticatorsRepository?.count({ where: { user: { id: accountId } } }) ??
        Promise.resolve(0),
      this.auditRepository?.count({
        where: {
          userId: accountId,
          eventType: SecurityEventType.LOGIN_FAILED,
          createdAt: MoreThan(weekAgo),
        },
      }) ?? Promise.resolve(0),
      // A revoked session still exists in the table, so count only the open ones.
      this.loginSessionsRepository?.count({
        where: { user: { id: accountId }, revokedAt: IsNull() },
      }) ?? Promise.resolve(0),
    ]);

    const signals: Record<string, boolean | number> = {
      emailVerified: user?.emailVerified ?? false,
      twoFactorEnabled: user?.twoFactorEnabled ?? false,
      recoveryCodesGenerated: Boolean(user?.recoveryCodeHashes?.length),
      passkeyCount,
      failedLoginsLast7Days: failedLogins,
      activeSessions: liveSessions,
      trustedIpCount: user?.trustedIpAddresses?.length ?? 0,
    };

    let score = 100;
    const recommendations: string[] = [];

    if (!user) {
      return {
        accountId,
        riskLevel: 'high',
        score: 0,
        recommendations: ['Account not found.'],
        signals,
        notEnforced: NOT_ENFORCED_CONTROLS,
      };
    }

    if (!user.emailVerified) {
      score -= 20;
      recommendations.push('Verify your email address to secure account recovery');
    }

    if (!user.twoFactorEnabled) {
      score -= 25;
      recommendations.push('Enable two-factor authentication for enhanced security');
    }

    if (passkeyCount === 0) {
      score -= 5;
      recommendations.push('Register a passkey for phishing-resistant sign-in');
    }

    if (!user.recoveryCodeHashes?.length) {
      score -= 5;
      recommendations.push('Generate recovery codes in case you lose access to 2FA');
    }

    if (failedLogins > 5) {
      score -= 15;
      recommendations.push(
        `${failedLogins} failed sign-in attempts in the last 7 days — review your account security`
      );
    }

    if (liveSessions > 10) {
      score -= 5;
      recommendations.push(
        `${liveSessions} active sessions — revoke the ones you do not recognise`
      );
    }

    score = Math.max(0, score);
    const riskLevel = score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high';

    return {
      accountId,
      riskLevel,
      score,
      recommendations,
      signals,
      notEnforced: NOT_ENFORCED_CONTROLS,
    };
  }

  private createDefaultSettings(accountId: string): SecuritySetting {
    return {
      accountId,
      twoFactorAuthentication: false,
      biometricAuthentication: false,
      passkeysEnabled: false,
      recoveryCodesEnabled: false,
      loginApprovalsEnabled: true,
      suspiciousLoginAlertsEnabled: true,
      deviceManagementEnabled: true,
      sessionManagementEnabled: true,
      accountRecoveryEnabled: true,
      securityCenterEnabled: true,
      loginNotifications: true,
      unknownLocationAlerts: true,
      sessionTimeout: true,
      sessionTimeoutMinutes: 30,
      securityLevel: 'standard',
      verifyNewDevices: false,
      allowRememberDevice: true,
      trustedIpAddresses: [],
      updatedAt: new Date(),
    };
  }

  private isValidIpAddress(ip: string): boolean {
    // Delegates to the shared parser, which is strict where the previous
    // regexes were not: the old IPv4 pattern accepted `999.999.999.999`, and
    // neither pattern accepted a CIDR range. Hostnames are rejected.
    return isValidIpOrCidr(ip);
  }
}
