import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { ChallengeType } from '../enums/challenge-type.enum';
import { ChallengeStatus } from '../enums/challenge-status.enum';

export class CreateChallengeDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(10000)
  description: string;

  @IsEnum(ChallengeType)
  type: ChallengeType;

  @IsEnum(ChallengeStatus)
  @IsOptional()
  status?: ChallengeStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  goalAmount?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  goalParticipantCount?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  goalActionCount?: number;

  // ISO 8601 strings — @IsDate() would 400 because the global pipe does not
  // implicitly convert strings to Date. The service converts these to Date
  // before persist.
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  linkUrl?: string;

  // Mirrored from the :groupId path param by the controller.
  @IsOptional()
  @IsUUID()
  groupId?: string;
}
