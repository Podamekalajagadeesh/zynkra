import { IsNumber, IsDateString } from 'class-validator';

export class CreateSponsoredPostDto {
  @IsNumber()
  budget: number;

  @IsDateString()
  expiresAt: string;
}