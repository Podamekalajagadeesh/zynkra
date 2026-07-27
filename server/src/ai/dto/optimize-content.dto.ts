import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class OptimizeContentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;
}
