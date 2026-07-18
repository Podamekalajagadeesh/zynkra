import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { PostVisibility } from '../../posts/entities/post.entity';

export class UpdateReelDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsUUID()
  @IsOptional()
  effectId?: string;

  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: PostVisibility;

  @IsString()
  @IsOptional()
  locationName?: string;
}