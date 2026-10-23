import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  description: string;
}
