import { IsString, IsNumber, IsOptional, IsNotEmpty, IsArray } from 'class-validator';

export class CreateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsArray()
  @IsOptional()
  attributes?: Record<string, string>;
}