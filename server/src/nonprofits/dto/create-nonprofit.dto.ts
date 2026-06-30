
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateNonprofitDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  missionStatement: string;
}