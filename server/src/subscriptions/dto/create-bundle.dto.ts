import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsArray, IsUUID, MaxLength } from 'class-validator';

export class CreateBundleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsArray()
  @IsUUID('4', { each: true })
  tierIds: string[];
}
