import { IsString, IsOptional, IsIP, MaxLength } from 'class-validator';

export class CreateAccountSessionDto {
  @IsString()
  @MaxLength(255)
  deviceName: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;
}

export class AccountSessionResponseDto {
  id: string;
  accountId: string;
  deviceName: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  isCurrent: boolean;
  createdAt: string;
  lastSeenAt: string;
  status: 'active' | 'revoked';
}

export class RevokeSessionDto {
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
