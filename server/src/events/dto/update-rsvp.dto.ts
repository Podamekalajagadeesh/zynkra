import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { RsvpStatus } from '../entities/rsvp-status.enum';

export class UpdateRsvpDto {
  @IsEnum(RsvpStatus)
  status: RsvpStatus;

  @IsOptional()
  @IsBoolean()
  plusOne?: boolean;
}