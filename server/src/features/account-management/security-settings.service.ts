import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';

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

@Injectable()
export class SecuritySettingsService {
  private readonly logger = new Logger(SecuritySettingsService.name);
  private readonly securitySettings = new Map<string, SecuritySetting>();
  private readonly securityLogs = new Map<string, SecurityAuditLog[]>();

  /**
   * Get security settings for an account
   */
  async getSecuritySettings(accountId: string): Promise<SecuritySetting> {
    let settings = this.securitySettings.get(accountId);

    if (!settings) {
      settings = this.createDefaultSettings(accountId);
      this.securitySettings.set(accountId, settings);
    }

    return settings;
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(
    accountId: string,
    updates: Partial<SecuritySetting>,
    modifiedBy?: string,
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
    if (updates.twoFactorAuthentication !== undefined) settings.twoFactorAuthentication = updates.twoFactorAuthentication;
    if (updates.biometricAuthentication !== undefined) settings.biometricAuthentication = updates.biometricAuthentication;
    if (updates.passkeysEnabled !== undefined) settings.passkeysEnabled = updates.passkeysEnabled;
    if (updates.recoveryCodesEnabled !== undefined) settings.recoveryCodesEnabled = updates.recoveryCodesEnabled;
    if (updates.loginApprovalsEnabled !== undefined) settings.loginApprovalsEnabled = updates.loginApprovalsEnabled;
    if (updates.suspiciousLoginAlertsEnabled !== undefined) settings.suspiciousLoginAlertsEnabled = updates.suspiciousLoginAlertsEnabled;
    if (updates.deviceManagementEnabled !== undefined) settings.deviceManagementEnabled = updates.deviceManagementEnabled;
    if (updates.sessionManagementEnabled !== undefined) settings.sessionManagementEnabled = updates.sessionManagementEnabled;
    if (updates.accountRecoveryEnabled !== undefined) settings.accountRecoveryEnabled = updates.accountRecoveryEnabled;
    if (updates.securityCenterEnabled !== undefined) settings.securityCenterEnabled = updates.securityCenterEnabled;
    if (updates.loginNotifications !== undefined) settings.loginNotifications = updates.loginNotifications;
    if (updates.unknownLocationAlerts !== undefined) settings.unknownLocationAlerts = updates.unknownLocationAlerts;
    if (updates.sessionTimeout !== undefined) settings.sessionTimeout = updates.sessionTimeout;
    if (updates.sessionTimeoutMinutes !== undefined) {
      if (updates.sessionTimeoutMinutes < 5 || updates.sessionTimeoutMinutes > 1440) {
        throw new BadRequestException('Session timeout must be between 5 and 1440 minutes');
      }
      settings.sessionTimeoutMinutes = updates.sessionTimeoutMinutes;
    }
    if (updates.securityLevel !== undefined) settings.securityLevel = updates.securityLevel;
    if (updates.verifyNewDevices !== undefined) settings.verifyNewDevices = updates.verifyNewDevices;
    if (updates.allowRememberDevice !== undefined) settings.allowRememberDevice = updates.allowRememberDevice;
    if (updates.trustedIpAddresses !== undefined) settings.trustedIpAddresses = updates.trustedIpAddresses;

    settings.updatedAt = new Date();
    settings.lastModifiedBy = modifiedBy;

    this.securitySettings.set(accountId, settings);

    // Log the change
    this.recordSecurityAuditLog(accountId, 'security_settings_updated', 'success', 'Security settings updated', {
      changes: updates,
      modifiedBy,
    });

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
    this.recordSecurityAuditLog(accountId, 'biometric_enabled', 'success', 'Biometric authentication enabled');

    return { success: true, message: 'Biometric authentication enabled' };
  }

  /**
   * Add trusted IP address
   */
  async addTrustedIpAddress(accountId: string, ipAddress: string): Promise<{ success: boolean; trustedIps: string[] }> {
    const settings = await this.getSecuritySettings(accountId);

    if (!this.isValidIpAddress(ipAddress)) {
      throw new BadRequestException('Invalid IP address format');
    }

    if (!settings.trustedIpAddresses.includes(ipAddress)) {
      settings.trustedIpAddresses.push(ipAddress);
      settings.updatedAt = new Date();
      this.securitySettings.set(accountId, settings);

      this.recordSecurityAuditLog(accountId, 'trusted_ip_added', 'success', `Trusted IP added: ${ipAddress}`, { ipAddress });
    }

    return { success: true, trustedIps: settings.trustedIpAddresses };
  }

  /**
   * Remove trusted IP address
   */
  async removeTrustedIpAddress(accountId: string, ipAddress: string): Promise<{ success: boolean; trustedIps: string[] }> {
    const settings = await this.getSecuritySettings(accountId);

    const index = settings.trustedIpAddresses.indexOf(ipAddress);
    if (index > -1) {
      settings.trustedIpAddresses.splice(index, 1);
      settings.updatedAt = new Date();
      this.securitySettings.set(accountId, settings);

      this.recordSecurityAuditLog(accountId, 'trusted_ip_removed', 'success', `Trusted IP removed: ${ipAddress}`, { ipAddress });
    }

    return { success: true, trustedIps: settings.trustedIpAddresses };
  }

  /**
   * Get security audit log
   */
  async getSecurityAuditLog(accountId: string, limit = 100): Promise<SecurityAuditLog[]> {
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
    metadata?: Record<string, any>,
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

    // Keep only last 1000 logs per account
    if (logs.length > 1000) {
      logs.shift();
    }

    this.logger.log(`Security audit: ${eventType} for account ${accountId} - ${description}`);

    return log;
  }

  /**
   * Clear old logs (older than specified days)
   */
  async clearOldAuditLogs(accountId: string, olderThanDays: number): Promise<{ success: boolean; clearedCount: number }> {
    const logs = this.securityLogs.get(accountId) || [];
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const originalLength = logs.length;
    const filtered = logs.filter(log => log.timestamp >= cutoffDate);

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
  async exportAuditLog(accountId: string): Promise<{ accountId: string; exportUrl: string; logCount: number; generatedAt: string }> {
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
  async setSecurityLevel(accountId: string, level: 'standard' | 'enhanced' | 'maximum'): Promise<SecuritySetting> {
    const settings = await this.getSecuritySettings(accountId);

    if (level === 'maximum' && !settings.twoFactorAuthentication) {
      throw new BadRequestException('Cannot set maximum security level without 2FA enabled');
    }

    settings.securityLevel = level;
    settings.updatedAt = new Date();

    this.securitySettings.set(accountId, settings);

    this.recordSecurityAuditLog(accountId, 'security_level_changed', 'success', `Security level changed to ${level}`);

    return settings;
  }

  /**
   * Get security risk assessment
   */
  async getSecurityRiskAssessment(accountId: string): Promise<{ accountId: string; riskLevel: 'low' | 'medium' | 'high'; score: number; recommendations: string[] }> {
    const settings = await this.getSecuritySettings(accountId);
    const logs = this.securityLogs.get(accountId) || [];

    let score = 100;
    const recommendations: string[] = [];

    // Check 2FA
    if (!settings.twoFactorAuthentication) {
      score -= 25;
      recommendations.push('Enable two-factor authentication for enhanced security');
    }

    // Check biometric
    if (!settings.biometricAuthentication) {
      score -= 10;
      recommendations.push('Consider enabling biometric authentication');
    }

    // Check login notifications
    if (!settings.loginNotifications) {
      score -= 5;
      recommendations.push('Enable login notifications to monitor account access');
    }

    // Check for failed login attempts
    const failedLogins = logs.filter(log => log.eventType.includes('login') && log.status === 'failed').length;
    if (failedLogins > 5) {
      score -= 15;
      recommendations.push(`High number of failed login attempts detected (${failedLogins})`);
    }

    // Check session timeout
    if (!settings.sessionTimeout) {
      score -= 10;
      recommendations.push('Enable session timeout for better security');
    }

    const riskLevel = score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high';

    return {
      accountId,
      riskLevel,
      score,
      recommendations,
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
    // Basic IP validation (IPv4 and IPv6)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}([0-9a-fA-F]{0,4})$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
}
