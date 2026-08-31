import { IsBoolean, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum SearchVisibility {
  EVERYONE = 'everyone',
  FRIENDS = 'friends',
  NO_ONE = 'no_one',
}

export enum ActivityVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

export enum StoryVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  FOLLOWERS = 'followers',
  ONLY_ME = 'only_me',
}

export enum MentionControls {
  EVERYONE = 'everyone',
  FOLLOWERS = 'followers',
  NO_ONE = 'no_one',
}

export class UpdatePrivacySettingsDto {
  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  readReceipts?: boolean;

  @IsOptional()
  @IsEnum(MentionControls)
  mentions?: MentionControls;

  @IsOptional()
  @IsEnum(ActivityVisibility)
  activityVisibility?: ActivityVisibility;

  @IsOptional()
  @IsEnum(StoryVisibility)
  storyVisibility?: StoryVisibility;

  @IsOptional()
  @IsEnum(SearchVisibility)
  searchVisibility?: SearchVisibility;

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
  @IsBoolean()
  profilePrivacy?: boolean;

  @IsOptional()
  @IsBoolean()
  postPrivacy?: boolean;

  @IsOptional()
  @IsBoolean()
  messagePrivacy?: boolean;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @IsOptional()
  @IsBoolean()
  allowTags?: boolean;

  @IsOptional()
  @IsObject()
  customPrivacySettings?: Record<string, any>;
}

export class PrivacySettingsResponseDto {
  showOnlineStatus: boolean;
  readReceipts: boolean;
  mentions: MentionControls;
  activityVisibility: ActivityVisibility;
  storyVisibility: StoryVisibility;
  searchVisibility: SearchVisibility;
  contactDiscovery: boolean;
  personalization: boolean;
  adPersonalization: boolean;
  profilePrivacy: boolean;
  postPrivacy: boolean;
  messagePrivacy: boolean;
  allowComments: boolean;
  allowTags: boolean;
  customPrivacySettings: Record<string, any>;
  updatedAt: string;
}
