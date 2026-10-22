import { IsInt, Min } from 'class-validator';

export class PollVoteDto {
  @IsInt()
  @Min(0)
  optionIndex: number;
}
