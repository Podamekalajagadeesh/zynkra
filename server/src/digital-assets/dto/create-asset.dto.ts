import { IsString, IsEnum, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { AssetType } from '../entities/digital-asset.entity';

export class CreateAssetDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AssetType)
  type: AssetType;

  @IsOptional()
  @IsArray()
  compatiblePlatforms?: string[];

  @IsOptional()
  @IsBoolean()
  isTransferable?: boolean;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}