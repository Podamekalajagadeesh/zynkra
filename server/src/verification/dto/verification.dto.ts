import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsEnum } from 'class-validator';
import { VerificationCategory, VerificationWorkflow } from '../entities/verification-request.entity';

export class CreateVerificationRequestDto {
  @IsOptional()
  @IsEnum(VerificationWorkflow)
  workflow?: VerificationWorkflow | 'personal' | 'business' | 'organization';

  @IsEnum(VerificationCategory)
  category: VerificationCategory;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  organizationName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  documentType?: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  justification: string;

  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({ require_tld: false }, { each: true })
  links: string[];
}

export class ReviewVerificationRequestDto {
  @IsIn(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}
