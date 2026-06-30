import { IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateVoteDto {
  @IsBoolean()
  @IsNotEmpty()
  choice: boolean;
}