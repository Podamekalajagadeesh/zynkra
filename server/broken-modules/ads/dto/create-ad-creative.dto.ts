import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateAdCreativeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsUrl()
  imageUrl: string;

  @IsUrl()
  @IsNotEmpty()
  destinationUrl: string;

  @IsString()
  @IsNotEmpty()
  callToAction: string;
}