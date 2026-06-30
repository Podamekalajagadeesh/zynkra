import { IsString } from 'class-validator';

export class AddSecretCrushDto {
  @IsString()
  crushedUserId: string;
}