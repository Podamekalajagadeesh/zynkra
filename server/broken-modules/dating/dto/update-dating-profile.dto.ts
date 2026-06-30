import { IsString, IsArray, IsNumber, IsObject, IsOptional } from 'class-validator';

export class UpdateDatingProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  datingPhotos?: string[];

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsObject()
  preferences?: {
    ageRange?: [number, number];
    gender?: string;
    distance?: number;
  };
}