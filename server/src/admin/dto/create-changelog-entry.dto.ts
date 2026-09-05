import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateChangelogEntryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  version: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsArray()
  @IsString({ each: true })
  changes: string[];

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  publishedAt?: string;
}
