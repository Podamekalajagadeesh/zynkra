import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StoryReactionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  reaction: string;
}
