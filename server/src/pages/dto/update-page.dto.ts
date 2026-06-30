import { IsString, IsOptional, IsUrl, IsBoolean } from 'class-validator';

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

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