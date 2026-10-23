import { IsEnum, IsOptional, IsNumber, IsString, IsUUID, Min, MaxLength } from 'class-validator';
import { ContributionType } from '../enums/contribution-type.enum';

export class CreateContributionDto {
  @IsEnum(ContributionType)
  type: ContributionType;

  // Negative amounts previously decremented challenge totals.
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  transactionHash?: string;

  // Mirrored from the :challengeId path param by the controller.
  @IsOptional()
  @IsUUID()
  challengeId?: string;
}
