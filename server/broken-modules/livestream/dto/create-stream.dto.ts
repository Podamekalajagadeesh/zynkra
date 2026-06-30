import { IsString, IsNotEmpty } from 'class-validator';

export class CreateStreamDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}