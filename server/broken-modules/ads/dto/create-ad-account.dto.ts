import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAdAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  businessName: string;

  @IsString()
  timezone: string;

  @IsString()
  currency: string;
}