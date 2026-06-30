import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsUrl } from 'class-validator';

export class SubmitCollabApplicationDto {
  @IsString()
  @IsNotEmpty()
  pitch: string;

  @IsNumber()
  @Min(0)
  proposedRate: number;

  @IsOptional()
  @IsUrl()
  portfolioLinks?: string;
}