
import { IsEnum, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import {
  PostVisibility,
  FriendRequestPrivacy,
  EmailSearchPrivacy,
  CommentPrivacy,
  TagPrivacy,
  MessagePrivacy,
  ProfilePrivacy,
} from '../entities/user.entity';
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
  @IsEnum(ProfilePrivacy)
  @IsOptional()
  profilePrivacy?: ProfilePrivacy;

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
  @IsBoolean()
  showOnlineStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  showLastSeenTimestamp?: boolean;

  @IsOptional()
  @IsBoolean()
  readReceipts?: boolean;

  @IsOptional()
  @IsBoolean()
  contactDiscovery?: boolean;

  @IsOptional()
  @IsBoolean()
  personalization?: boolean;

  @IsOptional()
  @IsBoolean()
  adPersonalization?: boolean;

  @IsOptional()
  @IsEnum(['everyone', 'followers', 'no_one'])
  mentions?: 'everyone' | 'followers' | 'no_one';

  @IsOptional()
  @IsEnum(['public', 'friends', 'private'])
  activityVisibility?: 'public' | 'friends' | 'private';

  @IsOptional()
  @IsEnum(['public', 'friends', 'followers', 'only_me'])
  storyVisibility?: 'public' | 'friends' | 'followers' | 'only_me';

  @IsOptional()
  @IsEnum(['everyone', 'friends', 'no_one'])
  searchVisibility?: 'everyone' | 'friends' | 'no_one';

  @IsOptional()
  @ValidateNested()
  @Type(() => ScreenshotProtectionDto)
  screenshotProtection?: ScreenshotProtectionDto;
}