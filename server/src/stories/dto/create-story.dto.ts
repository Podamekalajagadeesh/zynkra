import { StoryAudience } from '../entities/story.entity';
import { StoryElementType } from '../entities/story-element.entity';

export class CreateStoryDto {
  mediaUrl?: string;
  textContent?: string;
  backgroundOptions?: { type: 'color' | 'gradient'; values: string[] };
  elements?: { type: StoryElementType; data: any }[];
  arFilterName?: string;
  music?: { artist: string; song: string; url: string };
  audience?: StoryAudience;
  customAudienceId?: string;
  excludedUserIds?: string[];
  isBoosted?: boolean;
}