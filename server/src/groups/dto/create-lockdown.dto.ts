import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { LockdownMode } from '../entities/group-lockdown.entity';

export class CreateLockdownDto {
  @IsEnum(LockdownMode)
  mode: LockdownMode;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationHours?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  newMemberMuteHours?: number;
}
