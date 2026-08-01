import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsEnum, IsBoolean, Length, Matches, MaxLength, IsUrl, IsDate } from 'class-validator';
import { ProfilePrivacy, AccountType } from '../entities/user.entity';
import { RelationshipStatus } from '../entities/relationship-status.enum';

// Multipart profile forms send every field as a string, including empty ones.
// Convert '' to undefined so @IsOptional() validators skip blank fields and the
// entity keeps its previous value (TypeORM ignores undefined on save).
const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  value === '' ? undefined : value;

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @Transform(emptyToUndefined)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and periods.',
  })
  @Transform(emptyToUndefined)
  username?: string;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  walletAddress?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Transform(emptyToUndefined)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Transform(emptyToUndefined)
  pronouns?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(emptyToUndefined)
  bio?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Transform(emptyToUndefined)
  location?: string;

  @IsOptional()
  @IsUrl()
  @Transform(emptyToUndefined)
  website?: string;

  @IsOptional()
  @IsUrl()
  @Transform(emptyToUndefined)
  avatarUrl?: string;

  @IsOptional()
  @IsUrl()
  @Transform(emptyToUndefined)
  profileHeaderImageUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-f]{3}){1,2}$/i, { message: 'profileThemeColor must be a valid hex color code' })
  @Transform(emptyToUndefined)
  profileThemeColor?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Transform(emptyToUndefined)
  profileTheme?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Transform(emptyToUndefined)
  profileBioFont?: string;

  @IsOptional()
  @IsEnum(ProfilePrivacy)
  @Transform(emptyToUndefined)
  profilePrivacy?: ProfilePrivacy;

  @IsOptional()
  @IsEnum(AccountType)
  @Transform(emptyToUndefined)
  accountType?: AccountType;

  @IsOptional()
  @IsBoolean()
  @Transform(emptyToUndefined)
  isProfessional?: boolean;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Transform(emptyToUndefined)
  categoryLabel?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(emptyToUndefined)
  verified?: boolean;

  @IsOptional()
  @IsEnum(RelationshipStatus)
  @Transform(emptyToUndefined)
  relationshipStatus?: RelationshipStatus;

  @IsOptional()
  @IsBoolean()
  @Transform(emptyToUndefined)
  showOnlineStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(emptyToUndefined)
  showLastSeenTimestamp?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(emptyToUndefined)
  isOnline?: boolean;

  @IsOptional()
  @IsDate()
  @Transform(emptyToUndefined)
  lastSeenAt?: Date;
}
