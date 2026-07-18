import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class UpdateSubscriptionTierDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;
}