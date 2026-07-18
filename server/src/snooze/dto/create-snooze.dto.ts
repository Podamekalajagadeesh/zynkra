import { IsEnum, IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { SnoozedType } from '../entities/snooze.entity';

export class CreateSnoozeDto {
  @IsString()
  @IsNotEmpty()
  snoozedId: string;

  @IsEnum(SnoozedType)
  @IsNotEmpty()
  snoozedType: SnoozedType;

  @IsDateString()
  @IsNotEmpty()
  snoozeEndDate: string;
}