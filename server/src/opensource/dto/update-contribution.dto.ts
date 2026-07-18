import { IsString, IsEnum, IsOptional, IsDate } from 'class-validator';
import { ContributionStatus } from '../entities/contribution.entity';

export class UpdateContributionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ContributionStatus)
  status?: ContributionStatus;

  @IsOptional()
  @IsString()
  reviewComments?: string;

  @IsOptional()
  @IsDate()
  mergedAt?: Date;
}