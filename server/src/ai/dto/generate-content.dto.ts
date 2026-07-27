import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, MaxLength } from 'class-validator';

export class GenerateContentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  topic: string;

  @IsEnum(['announcement', 'tutorial', 'opinion', 'promotional', 'question', 'story', 'caption'])
  type: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;

  @IsOptional()
  @IsEnum(['professional', 'casual', 'humorous', 'inspirational'])
  tone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}
