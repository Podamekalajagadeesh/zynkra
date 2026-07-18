import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ContributionType } from '../entities/contribution.entity';

export class CreateContributionDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(ContributionType)
  type: ContributionType;

  @IsOptional()
  @IsArray()
  affectedFiles?: string[];

  @IsOptional()
  @IsString()
  codeChanges?: string;

  @IsOptional()
  @IsString()
  pullRequestUrl?: string;
}