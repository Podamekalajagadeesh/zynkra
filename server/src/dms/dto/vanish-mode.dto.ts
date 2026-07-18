import { IsBoolean } from 'class-validator';

export class VanishModeDto {
  @IsBoolean()
  vanishMode: boolean;
}