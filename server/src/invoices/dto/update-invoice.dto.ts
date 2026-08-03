import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsDateString,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { InvoiceStatus } from '../entities/invoice.entity';
import { InvoiceLineItemDto } from './create-invoice.dto';

export class UpdateInvoiceDto {
  @IsString()
  @IsOptional()
  @MaxLength(160)
  clientName?: string;

  @IsEmail()
  @IsOptional()
  clientEmail?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  @IsOptional()
  lineItems?: InvoiceLineItemDto[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;
}
