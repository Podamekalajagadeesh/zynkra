import { IsString, IsNotEmpty, IsDate, IsOptional } from 'class-validator';

export class CreateScheduledStreamDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsDate()
  @IsNotEmpty()
  scheduledTime: Date;
}