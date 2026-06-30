
import { IsEnum, IsOptional } from 'class-validator';
import {
  PostVisibility,
  FriendRequestPrivacy,
  EmailSearchPrivacy,
  CommentPrivacy,
  TagPrivacy,
  MessagePrivacy,
} from '../entities/user.entity';
import { IsOptional, IsBoolean, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class ScreenshotProtectionDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  level?: string;

  @IsOptional()
  @IsBoolean()
  applyToDms?: boolean;

  @IsOptional()
  @IsBoolean()
  applyToPosts?: boolean;

  @IsOptional()
  @IsBoolean()
  applyToStories?: boolean;

  @IsOptional()
  @IsBoolean()
  applyToProfile?: boolean;
}

export class UpdatePrivacyDto {
  @IsEnum(PostVisibility)
  @IsOptional()
  postVisibility?: PostVisibility;

  @IsEnum(FriendRequestPrivacy)
  @IsOptional()
  friendRequestPrivacy?: FriendRequestPrivacy;

  @IsEnum(EmailSearchPrivacy)
  @IsOptional()
  emailSearchPrivacy?: EmailSearchPrivacy;

  @IsEnum(CommentPrivacy)
  @IsOptional()
  commentPrivacy?: CommentPrivacy;

  @IsEnum(TagPrivacy)
  @IsOptional()
  tagPrivacy?: TagPrivacy;

  @IsEnum(MessagePrivacy)
  @IsOptional()
  messagePrivacy?: MessagePrivacy;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScreenshotProtectionDto)
  screenshotProtection?: ScreenshotProtectionDto;
}