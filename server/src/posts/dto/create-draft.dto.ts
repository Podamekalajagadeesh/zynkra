import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PostType, PostVisibility } from '../entities/post.entity';

export class DraftMediaDto {
  @IsString()
  url: string;

  @IsString()
  type: 'image' | 'video';

  @IsOptional()
  @IsString()
  altText?: string;
}

export class CreateDraftDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DraftMediaDto)
  media?: DraftMediaDto[];

  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @IsOptional()
  @IsEnum(PostType)
  postType?: PostType;
}
