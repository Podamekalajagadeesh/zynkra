import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { AccountProfileType } from '../entities/account-profile.entity';

export class CreateAccountProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @IsOptional()
  @IsEnum(AccountProfileType)
  accountType?: AccountProfileType;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsUUID()
  id?: string;
}
