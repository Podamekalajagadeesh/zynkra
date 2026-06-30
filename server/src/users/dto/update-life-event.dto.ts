import { IsString, IsDateString, IsOptional } from 'class-validator';

export class UpdateLifeEventDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsDateString()
  @IsOptional()
  date?: Date;

  @IsString()
  @IsOptional()
  description?: string;
}