import { IsString, IsNotEmpty, IsOptional, IsUrl, IsBoolean } from 'class-validator';

export class CreatePageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;

  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @IsOptional()
  @IsBoolean()
  automatedResponseEnabled?: boolean;

  @IsOptional()
  @IsString()
  automatedResponseMessage?: string;
}