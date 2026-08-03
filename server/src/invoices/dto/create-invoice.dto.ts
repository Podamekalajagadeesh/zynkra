import {
  Type,
} from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class InvoiceLineItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  description: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  clientName: string;

  @IsEmail()
  @IsOptional()
  clientEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems: InvoiceLineItemDto[];

  @IsNumber()
  @Min(0)
  taxRate: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
