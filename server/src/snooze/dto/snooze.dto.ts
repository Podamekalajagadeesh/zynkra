import { SnoozedType } from '../entities/snooze.entity';

export class SnoozeDto {
  id: string;
  snoozedId: string;
  snoozedType: SnoozedType;
  snoozeEndDate: Date;
}