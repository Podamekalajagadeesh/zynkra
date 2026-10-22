import { IsOptional, IsString } from 'class-validator';
import { StoryAudience } from '../entities/story.entity';
import { StoryElementType } from '../entities/story-element.entity';

// The app's global ValidationPipe (whitelist: true) runs class-validator 0.14,
// whose forbidUnknownValues default rejects classes with zero validation
// metadata and whose whitelist strips undecorated properties — so every field
// needs at least @IsOptional() or POST /stories 400s before the controller
// runs. Nested shapes (backgroundOptions, elements, music) are intentionally
// not nested-validated here: multipart clients send them as JSON strings that
// the controller parses after the pipe, and the service enforces their shape.
export class CreateStoryDto {
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  backgroundOptions?: { type: 'color' | 'gradient'; values: string[] };

  @IsOptional()
  elements?: { type: StoryElementType; data: any }[];

  @IsOptional()
  arFilterName?: string;

  @IsOptional()
  music?: { artist: string; song: string; url: string };

  @IsOptional()
  audience?: StoryAudience;

  @IsOptional()
  @IsString()
  customAudienceId?: string;

  @IsOptional()
  excludedUserIds?: string[];

  @IsOptional()
  isBoosted?: boolean;
}
