import { IsString, IsNumber, IsPositive, IsOptional, IsArray, IsUUID, MaxLength } from 'class-validator';

export class UpdateBundleDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tierIds?: string[];

  @IsOptional()
  isActive?: boolean;
}
