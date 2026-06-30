import { IsUUID } from 'class-validator';

export class CreateAdDto {
  @IsUUID()
  adSetId: string;

  @IsUUID()
  creativeId: string;
}