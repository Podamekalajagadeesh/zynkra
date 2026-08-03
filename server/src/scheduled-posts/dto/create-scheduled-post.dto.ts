import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsISO8601 } from 'class-validator';

export class CreateScheduledPostDto {
  @IsString()
  @IsNotEmpty()
  @IsString()
  content: string;

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
