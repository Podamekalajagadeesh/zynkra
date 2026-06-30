import { IsEmail, IsOptional, IsString, IsEnum, IsBoolean, Length, Matches, MaxLength, IsUrl } from 'class-validator';
import { ProfilePrivacy, AccountType } from '../entities/user.entity';
import { RelationshipStatus } from '../entities/relationship-status.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and periods.',
  })
  username?: string;

  @IsOptional()
  @IsString()
  walletAddress?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  pronouns?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  location?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsUrl()
  profileHeaderImageUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-f]{3}){1,2}$/i, { message: 'profileThemeColor must be a valid hex color code' })
  profileThemeColor?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  profileTheme?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  profileBioFont?: string;

  @IsOptional()
  @IsEnum(ProfilePrivacy)
  profilePrivacy?: ProfilePrivacy;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsOptional()
  @IsBoolean()
  isProfessional?: boolean;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  categoryLabel?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsEnum(RelationshipStatus)
  relationshipStatus?: RelationshipStatus;

  // Activity status controls
  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  showLastSeenTimestamp?: boolean;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @IsDate()
  lastSeenAt?: Date;
}