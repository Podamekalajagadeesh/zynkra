import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class ApproveLoginRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewerNote?: string;

  @IsOptional()
  @IsBoolean()
  rememberDevice?: boolean;
}

export class RejectLoginRequestDto {
  @IsString()
  @MaxLength(500)
  @MaxLength(1000)
  rejectionReason: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewerNote?: string;
}
