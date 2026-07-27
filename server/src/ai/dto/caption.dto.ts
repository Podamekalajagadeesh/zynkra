import { IsEnum, IsOptional, IsArray, IsString } from 'class-validator';

export class CaptionDto {
  @IsEnum(['image', 'video', 'audio'])
  mediaType: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}
