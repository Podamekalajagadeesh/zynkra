import { IsBoolean, IsString, IsEnum, IsOptional, IsObject, MaxLength, IsInt, Min, Max } from 'class-validator';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum AppIcon {
  DEFAULT = 'default',
  NEON = 'neon',
  OCEAN = 'ocean',
  SUNSET = 'sunset',
  CREATOR_CLASSIC = 'creator-classic',
  CREATOR_VIBRANT = 'creator-vibrant',
  CREATOR_MINIMAL = 'creator-minimal',
}

export enum DefaultPrivacy {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

export enum FeedSort {
  ALGORITHMIC = 'algorithmic',
  CHRONOLOGICAL = 'chronological',
}

export enum ColorBlindMode {
  NONE = 'none',
  PROTANOPIA = 'protanopia',
  DEUTERANOPIA = 'deuteranopia',
  TRITANOPIA = 'tritanopia',
  ACHROMATOPSIA = 'achromatopsia',
}

export class UpdateAccountPreferencesDto {
  @IsOptional()
  @IsEnum(AppIcon)
  appIcon?: AppIcon;

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
  @IsBoolean()
  keyboardNavigationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  autoTranslate?: boolean;

  @IsOptional()
  @IsEnum(FeedSort)
  feedSort?: FeedSort;

  @IsOptional()
  @IsBoolean()
  screenTimeEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  dailyScreenTimeLimit?: number;

  @IsOptional()
  @IsBoolean()
  contentWarningsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  highContrastMode?: boolean;

  @IsOptional()
  @IsBoolean()
  reducedMotion?: boolean;

  @IsOptional()
  @IsBoolean()
  screenReaderOptimized?: boolean;

  @IsOptional()
  @IsBoolean()
  voiceControlEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  largeTextMode?: boolean;

  @IsOptional()
  @IsEnum(ColorBlindMode)
  colorBlindMode?: ColorBlindMode;

  @IsOptional()
  @IsObject()
  customSettings?: Record<string, any>;
}

export class AccountPreferencesResponseDto {
  theme: Theme;
  appIcon: AppIcon;
  language: string;
  timezone: string;
  defaultPrivacy: DefaultPrivacy;
  keyboardNavigationEnabled: boolean;
  autoTranslate: boolean;
  feedSort: FeedSort;
  screenTimeEnabled: boolean;
  dailyScreenTimeLimit: number;
  contentWarningsEnabled: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  voiceControlEnabled: boolean;
  largeTextMode: boolean;
  colorBlindMode: ColorBlindMode;
  customSettings: Record<string, any>;
  updatedAt: string;
}
