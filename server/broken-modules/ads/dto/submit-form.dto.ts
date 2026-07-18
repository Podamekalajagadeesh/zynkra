import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class SubmitFormDto {
  @IsString()
  submitterId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}