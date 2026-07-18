import { IsString, IsNotEmpty } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}