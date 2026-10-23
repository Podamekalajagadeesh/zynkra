import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { ChallengeType } from '../enums/challenge-type.enum';
import { ChallengeStatus } from '../enums/challenge-status.enum';

export class UpdateChallengeDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  description?: string;

  @IsEnum(ChallengeType)
  @IsOptional()
  type?: ChallengeType;

  @IsEnum(ChallengeStatus)
  @IsOptional()
  status?: ChallengeStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  goalAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  currentAmount?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  goalParticipantCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  currentParticipantCount?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  goalActionCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  currentActionCount?: number;

  // ISO 8601 strings; converted to Date in the service before persisting.
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  linkUrl?: string;
}
