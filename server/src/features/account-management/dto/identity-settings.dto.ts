import { IsString, IsOptional, IsBoolean, IsObject, MaxLength, IsDate } from 'class-validator';

export class CreateIdentitySettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsBoolean()
  publicProfile?: boolean;

  @IsOptional()
  @IsBoolean()
  creatorMode?: boolean;

  @IsOptional()
  @IsBoolean()
  businessMode?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  organizationName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  organizationRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  organizationWebsite?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

export class UpdateIdentitySettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsBoolean()
  publicProfile?: boolean;

  @IsOptional()
  @IsBoolean()
  creatorMode?: boolean;

  @IsOptional()
  @IsBoolean()
  businessMode?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  organizationName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  organizationRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  organizationWebsite?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
