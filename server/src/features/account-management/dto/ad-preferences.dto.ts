import { IsBoolean, IsEnum, IsOptional, IsArray, IsString, MaxLength } from 'class-validator';

export enum AdTargeting {
  DISABLED = 'disabled',
  BASIC = 'basic',
  PERSONALIZED = 'personalized',
  ADVANCED = 'advanced',
}

export enum AdCategory {
  TECHNOLOGY = 'technology',
  FASHION = 'fashion',
  HEALTH = 'health',
  FOOD = 'food',
  TRAVEL = 'travel',
  FINANCE = 'finance',
  EDUCATION = 'education',
  ENTERTAINMENT = 'entertainment',
  SPORTS = 'sports',
  HOME_GARDEN = 'home_garden',
  AUTOMOTIVE = 'automotive',
  BUSINESS = 'business',
}

export class UpdateAdPreferencesDto {
  @IsOptional()
  @IsEnum(AdTargeting)
  adTargeting?: AdTargeting;

  @IsOptional()
  @IsBoolean()
  personalisedAds?: boolean;

  @IsOptional()
  @IsBoolean()
  thirdPartyAds?: boolean;

  @IsOptional()
  @IsBoolean()
  affiliateAds?: boolean;

  @IsOptional()
  @IsBoolean()
  allowCrossSiteTracking?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(AdCategory, { each: true })
  preferredCategories?: AdCategory[];

  @IsOptional()
  @IsArray()
  @IsEnum(AdCategory, { each: true })
  blockedCategories?: AdCategory[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  blockedAdvertisers?: string[];

  @IsOptional()
  @IsBoolean()
  showAds?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  adFrequency?: 'high' | 'medium' | 'low' | 'minimal';
}

export class AdPreferencesResponseDto {
  adTargeting: AdTargeting;
  personalisedAds: boolean;
  thirdPartyAds: boolean;
  affiliateAds: boolean;
  allowCrossSiteTracking: boolean;
  preferredCategories: AdCategory[];
  blockedCategories: AdCategory[];
  blockedAdvertisers: string[];
  showAds: boolean;
  adFrequency: string;
  updatedAt: string;
}
