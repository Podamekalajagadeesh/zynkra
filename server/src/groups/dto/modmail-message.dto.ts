import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class ModMailMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  /** Internal note visible only to moderators (moderators/admins only). */
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;
}
