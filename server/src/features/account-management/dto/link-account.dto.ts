import { IsString, IsEnum, IsOptional, IsBoolean, IsEmail } from 'class-validator';
import { LinkedAccountProvider } from '../entities/linked-account.entity';

export class LinkAccountDto {
  @IsEnum(LinkedAccountProvider)
  provider: LinkedAccountProvider;

  @IsString()
  externalUserId: string;

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UnlinkAccountDto {
  @IsString()
  linkedAccountId: string;
}

export class SetPrimaryAccountDto {
  @IsString()
  linkedAccountId: string;
}
