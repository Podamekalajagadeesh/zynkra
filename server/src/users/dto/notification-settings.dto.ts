import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class NotificationSettingsDto {
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  likes?: boolean;

  @IsBoolean()
  @IsOptional()
  comments?: boolean;

  @IsBoolean()
  @IsOptional()
  newFollowers?: boolean;

  @IsBoolean()
  @IsOptional()
  messages?: boolean;

  @IsBoolean()
  @IsOptional()
  emailDigest?: boolean;

  @IsBoolean()
  @IsOptional()
  pushAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  smsAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  securityAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyMentions?: boolean;

  @IsObject()
  @IsOptional()
  customNotifications?: Record<string, boolean>;
}