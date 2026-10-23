import { IsString, IsNotEmpty, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class ModMailMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;

  /** Internal note visible only to moderators (moderators/admins only). */
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;
}
