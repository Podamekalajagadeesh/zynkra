import { IsObject, IsNotEmpty } from 'class-validator';

export class CreateLeadDto {
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}