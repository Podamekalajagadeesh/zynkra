import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AiAnalyzeContentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;
}
