import { IsArray, IsBoolean, IsISO8601, IsOptional, IsString } from 'class-validator';

export class UpdateScheduledPostDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  postType?: string;

  @IsOptional()
  @IsISO8601()
  scheduledFor?: string;

  @IsOptional()
  @IsBoolean()
  isOptimalTime?: boolean;

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  crossPlatformIds?: string[];
}
