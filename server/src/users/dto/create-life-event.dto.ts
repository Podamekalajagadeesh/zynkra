import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateLifeEventDto {
  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsDateString()
  date: Date;

  @IsString()
  @IsOptional()
  description?: string;
}