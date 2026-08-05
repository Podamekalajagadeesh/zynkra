import { IsNotEmpty, IsString } from 'class-validator';

export class MagicLinkVerifyDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
