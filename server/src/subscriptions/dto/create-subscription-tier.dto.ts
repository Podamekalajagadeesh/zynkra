import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateSubscriptionTierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;
}