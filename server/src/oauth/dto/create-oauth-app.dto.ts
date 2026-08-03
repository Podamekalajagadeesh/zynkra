import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUrl,
  MaxLength,
} from 'class-validator';

export const OAUTH_SCOPES = ['read_profile', 'read_posts', 'write_posts'];

export class CreateOAuthAppDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsUrl({ require_tld: false }, { each: true })
  redirectUris: string[];

  @IsArray()
  @IsOptional()
  scopes?: string[];

  @IsUrl({ require_tld: false })
  @IsOptional()
  homepageUrl?: string;
}
