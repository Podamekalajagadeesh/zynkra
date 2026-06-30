import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateReelEffectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  thumbnailUrl: string;
}