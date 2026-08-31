import { IsString, IsEnum, IsOptional, IsArray, IsEmail, MinLength, MaxLength } from 'class-validator';
import { VerificationRequestType } from '../entities/verification-request.entity';

export class CreateVerificationRequestDto {
  @IsEnum(VerificationRequestType)
  type: VerificationRequestType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateVerificationRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class ApproveVerificationRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class RejectVerificationRequestDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  rejectionReason: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class AppealVerificationDecisionDto {
  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  appealReason: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  links?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}
