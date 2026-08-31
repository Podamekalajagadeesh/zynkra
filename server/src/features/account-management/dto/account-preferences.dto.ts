import { IsString, IsEnum, IsOptional, IsObject, MaxLength } from 'class-validator';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum DefaultPrivacy {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

export class UpdateAccountPreferencesDto {
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @IsOptional()
  @IsEnum(DefaultPrivacy)
  defaultPrivacy?: DefaultPrivacy;

  @IsOptional()
  @IsObject()
  customSettings?: Record<string, any>;
}

export class AccountPreferencesResponseDto {
  theme: Theme;
  language: string;
  timezone: string;
  defaultPrivacy: DefaultPrivacy;
  customSettings: Record<string, any>;
  updatedAt: string;
}
