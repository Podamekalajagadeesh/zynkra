
import { IsString, IsOptional } from 'class-validator';

export class RejectNonprofitDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
