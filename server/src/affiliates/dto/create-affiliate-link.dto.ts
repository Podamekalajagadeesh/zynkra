import { IsString, IsUrl, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateAffiliateLinkDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  destinationUrl: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  commissionRate?: number;
}