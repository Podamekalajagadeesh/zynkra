import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class HashtagsDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}
