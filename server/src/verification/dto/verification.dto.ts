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
import { VerificationCategory } from '../entities/verification-request.entity';

export class CreateVerificationRequestDto {
  @IsEnum(VerificationCategory)
  category: VerificationCategory;

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
