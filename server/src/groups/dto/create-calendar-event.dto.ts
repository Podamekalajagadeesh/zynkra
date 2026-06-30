import { IsString, IsDate, IsOptional, IsUUID } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDate()
  startTime: Date;

  @IsDate()
  endTime: Date;

  @IsOptional()
  @IsString()
  location?: string;

  @IsUUID()
  groupId: string;
}