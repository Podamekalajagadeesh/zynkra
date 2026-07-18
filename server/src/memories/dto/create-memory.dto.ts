import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PostVisibility } from '../../posts/entities/post.entity';

export enum RealityContext {
  PHYSICAL = 'physical',
  AUGMENTED = 'augmented',
  VIRTUAL = 'virtual',
  NEURAL = 'neural',
}

class MemoryLocationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

class MemoryContextDto {
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  activity?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MemoryLocationDto)
  location?: MemoryLocationDto;
}

class MemoryEmotionDto {
  @IsOptional()
  @IsNumber()
  joy?: number;

  @IsOptional()
  @IsNumber()
  sadness?: number;

  @IsOptional()
  @IsNumber()
  excitement?: number;

  @IsOptional()
  @IsNumber()
  calm?: number;

  @IsOptional()
  @IsNumber()
  anger?: number;

  @IsOptional()
  @IsNumber()
  surprise?: number;

  @IsOptional()
  @IsNumber()
  love?: number;

  @IsOptional()
  @IsNumber()
  fear?: number;
}

class MemoryPrivacySettingsDto {
  @IsOptional()
  @IsBoolean()
  allowReplay?: boolean;

  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

class MemoryMetadataDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => MemoryEmotionDto)
  emotions?: MemoryEmotionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MemoryContextDto)
  context?: MemoryContextDto;

  @IsOptional()
  sensory?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  neuralTimestamp?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MemoryPrivacySettingsDto)
  privacySettings?: MemoryPrivacySettingsDto;
}

export class CreateMemoryDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @IsOptional()
  @ValidateNested()
  @Type(() => MemoryMetadataDto)
  memoryMetadata?: MemoryMetadataDto;

  @IsOptional()
  @IsBoolean()
  isMemory?: boolean;

  @IsOptional()
  @IsEnum(RealityContext)
  realityContext?: RealityContext;

  @IsOptional()
  @IsDateString()
  timeCapsuleUnlockAt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  timeCapsuleRecipients?: string[];

  @IsOptional()
  @IsString()
  timeCapsuleMessage?: string;
}