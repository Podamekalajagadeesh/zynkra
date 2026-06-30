import { IsBoolean, IsOptional } from 'class-validator';

export class NotificationSettingsDto {
  @IsBoolean()
  @IsOptional()
  likes?: boolean;

  @IsBoolean()
  @IsOptional()
  comments?: boolean;

  @IsBoolean()
  @IsOptional()
  newFollowers?: boolean;
}