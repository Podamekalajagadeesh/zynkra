import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StoryReplyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;
}
