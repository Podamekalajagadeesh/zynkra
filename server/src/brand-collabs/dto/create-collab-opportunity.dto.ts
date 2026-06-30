import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsArray, IsDate, IsOptional } from 'class-validator';

export enum PaymentType {
  FIXED = 'fixed',
  COMMISSION = 'commission',
  HYBRID = 'hybrid'
}

export class CreateCollabOpportunityDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  requirements: string;

  @IsNumber()
  @Min(0)
  budget: number;

  @IsEnum(PaymentType)
  paymentType: 'fixed' | 'commission' | 'hybrid';

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionRate?: number;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsArray()
  requiredPlatforms?: string[];

  @IsOptional()
  @IsArray()
  requiredNiches?: string[];

  @IsNumber()
  @Min(1)
  minFollowers: number;

  @IsDate()
  deadline: Date;
}