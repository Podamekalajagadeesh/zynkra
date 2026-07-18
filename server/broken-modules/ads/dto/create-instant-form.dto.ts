import { IsString, IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InstantFormField } from '../entities/instant-form.entity';

export class CreateInstantFormDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstantFormFieldDto)
  fields: InstantFormField[];

  @IsString()
  @IsNotEmpty()
  callToAction: string;
}

class InstantFormFieldDto implements InstantFormField {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: 'text' | 'email' | 'phone' | 'dropdown';

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsArray()
  options?: string[];
}