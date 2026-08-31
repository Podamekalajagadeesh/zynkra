import { IsString, IsBoolean, IsOptional, MaxLength, IsEnum, IsArray, IsNumber } from 'class-validator';

export enum SecurityLevel {
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
  MAXIMUM = 'maximum',
}

export class UpdateSecuritySettingsDto {
  @IsOptional()
  @IsBoolean()
  twoFactorAuthentication?: boolean;

  @IsOptional()
  @IsBoolean()
  biometricAuthentication?: boolean;

  @IsOptional()
  @IsBoolean()
  passkeysEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  recoveryCodesEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  loginApprovalsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  suspiciousLoginAlertsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  deviceManagementEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  sessionManagementEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  accountRecoveryEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  securityCenterEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  loginNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  unknownLocationAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  sessionTimeout?: boolean;

  @IsOptional()
  @IsNumber()
  sessionTimeoutMinutes?: number;

  @IsOptional()
  @IsEnum(SecurityLevel)
  securityLevel?: SecurityLevel;

  @IsOptional()
  @IsBoolean()
  verifyNewDevices?: boolean;

  @IsOptional()
  @IsBoolean()
  allowRememberDevice?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trustedIpAddresses?: string[];
}

export class SecuritySettingsResponseDto {
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
  securityLevel: SecurityLevel;
  verifyNewDevices: boolean;
  allowRememberDevice: boolean;
  trustedIpAddresses: string[];
  updatedAt: string;
}

export class SecurityAuditLogResponseDto {
  eventId: string;
  accountId: string;
  eventType: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  status: 'success' | 'failed' | 'warning';
  description: string;
  metadata?: Record<string, any>;
}
