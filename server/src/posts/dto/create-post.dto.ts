import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUrl,
  IsEnum,
  IsBoolean,
  ValidateNested,
  IsNumber,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { PostVisibility, PostType } from '../entities/post.entity';
import { Type } from 'class-transformer';

class MediaDto {
  @IsUrl()
  url: string;

  @IsString()
  type: 'image' | 'video';

  @IsOptional()
  @IsString()
  altText?: string;
}

class StickerDto {
  @IsUrl()
  url: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

class PollOptionDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

class PollDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @ValidateNested({ each: true })
  @Type(() => PollOptionDto)
  options: PollOptionDto[];
}

class ProductTagDto {
  @IsString()
  product_id: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

class EventTagDto {
  @IsString()
  event_id: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

class MusicTagDto {
  @IsString()
  music_id: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

export class CreatePostDto {
  @IsNumber()
  @IsNotEmpty()
  profileId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  content: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  media?: MediaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductTagDto)
  productTags?: ProductTagDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventTagDto)
  eventTags?: EventTagDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MusicTagDto)
  musicTags?: MusicTagDto[];

  @IsOptional()
  @IsString()
  filter?: string;

  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @IsOptional()
  @IsBoolean()
  tokenGated?: boolean;

  @IsOptional()
  @IsString()
  contractAddress?: string;

  @IsOptional()
  @IsString()
  requiredTokenBalance?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PollDto)
  poll?: PollDto;

  @IsOptional()
  @IsBoolean()
  showLikes?: boolean;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  activity?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StickerDto)
  stickers?: StickerDto[];

  @IsOptional()
  @IsEnum(PostType)
  postType?: PostType;

  @IsOptional()
  @IsString()
  reelEffectId?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsBoolean()
  isSensitive?: boolean;

  @IsOptional()
  @IsBoolean()
  enableScreenshotProtection?: boolean;

  @IsOptional()
  @IsString()
  quotedPostId?: string;
}