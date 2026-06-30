import { IsEnum, IsOptional, IsNumber, IsString, IsUUID } from 'class-validator';
import { ContributionType } from '../enums/contribution-type.enum';

export class CreateContributionDto {
  @IsEnum(ContributionType)
  type: ContributionType;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  transactionHash?: string;

  @IsUUID()
  challengeId: string;
}