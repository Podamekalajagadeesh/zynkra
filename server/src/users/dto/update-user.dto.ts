import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches, MaxLength, IsUrl } from 'class-validator';

// Multipart profile forms send every field as a string, including empty ones.
// Convert '' to undefined so @IsOptional() validators skip blank fields and the
// entity keeps its previous value (TypeORM ignores undefined on save).
const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  value === '' ? undefined : value;

export class UpdateUserDto {
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
  @IsString()
  @Length(2, 50)
  @Transform(emptyToUndefined)
  categoryLabel?: string;

}
