import { IsString, IsEnum, IsOptional, IsNumber, IsDate, IsUUID } from 'class-validator';
import { ChallengeType } from '../enums/challenge-type.enum';
import { ChallengeStatus } from '../enums/challenge-status.enum';

export class CreateChallengeDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(ChallengeType)
  type: ChallengeType;

  @IsEnum(ChallengeStatus)
  @IsOptional()
  status?: ChallengeStatus;

  @IsNumber()
  @IsOptional()
  goalAmount?: number;

  @IsNumber()
  @IsOptional()
  goalParticipantCount?: number;

  @IsNumber()
  @IsOptional()
  goalActionCount?: number;

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

  @IsUUID()
  groupId: string;
}