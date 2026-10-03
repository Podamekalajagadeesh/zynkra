import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  creatorId: string;

  @IsString()
  @IsNotEmpty()
  tier: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
