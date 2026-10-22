import { IsBoolean, IsOptional } from 'class-validator';

export class TrackViewDto {
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
