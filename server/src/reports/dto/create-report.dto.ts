import { IsString, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @MinLength(1)
  reason: string;
}