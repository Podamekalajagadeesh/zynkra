import { IsBoolean, IsOptional, IsObject } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailDigest?: boolean;

  @IsOptional()
  @IsBoolean()
  pushAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  smsAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyNewFollower?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyMentions?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyMessages?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyComments?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyLikes?: boolean;

  @IsOptional()
  @IsObject()
  customNotifications?: Record<string, boolean>;
}

export class NotificationPreferencesResponseDto {
  emailDigest: boolean;
  pushAlerts: boolean;
  smsAlerts: boolean;
  securityAlerts: boolean;
  notifyNewFollower: boolean;
  notifyMentions: boolean;
  notifyMessages: boolean;
  notifyComments: boolean;
  notifyLikes: boolean;
  customNotifications: Record<string, boolean>;
  updatedAt: string;
}
