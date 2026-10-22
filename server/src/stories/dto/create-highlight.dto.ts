import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateHighlightDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  coverUrl: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  storyIds: string[];
}
