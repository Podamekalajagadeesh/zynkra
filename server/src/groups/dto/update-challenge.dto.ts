import { IsString, IsEnum, IsOptional, IsNumber, IsDate } from 'class-validator';
import { ChallengeType } from '../enums/challenge-type.enum';
import { ChallengeStatus } from '../enums/challenge-status.enum';

export class UpdateChallengeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ChallengeType)
  @IsOptional()
  type?: ChallengeType;

  @IsEnum(ChallengeStatus)
  @IsOptional()
  status?: ChallengeStatus;

  @IsNumber()
  @IsOptional()
  goalAmount?: number;

  @IsNumber()
  @IsOptional()
  currentAmount?: number;

  @IsNumber()
  @IsOptional()
  goalParticipantCount?: number;

  @IsNumber()
  @IsOptional()
  currentParticipantCount?: number;

  @IsNumber()
  @IsOptional()
  goalActionCount?: number;

  @IsNumber()
  @IsOptional()
  currentActionCount?: number;

  @IsDate()
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  linkUrl?: string;
}