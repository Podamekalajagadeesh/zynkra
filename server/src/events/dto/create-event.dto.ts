import {
  IsString,
  IsDateString,
  MinLength,
  IsOptional,
  IsArray,
  IsUUID,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
  IsUrl,
} from 'class-validator';
import { EventType } from '../entities/event.entity';

export class CreateEventDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsEnum(EventType)
  type: EventType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  location?: string;

  @IsOptional()
  @IsUrl()
  virtualMeetingLink?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isTicketed?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ticketPrice?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  coHostIds?: string[];
}