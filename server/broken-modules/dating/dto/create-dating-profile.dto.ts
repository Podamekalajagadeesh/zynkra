import { IsString, IsArray, IsNumber, IsObject } from 'class-validator';

export class CreateDatingProfileDto {
  @IsString()
  bio: string;

  @IsArray()
  @IsString({ each: true })
  interests: string[];

  @IsArray()
  @IsString({ each: true })
  datingPhotos: string[];

  @IsString()
  gender: string;

  @IsNumber()
  age: number;

  @IsString()
  location: string;

  @IsObject()
  preferences: {
    ageRange?: [number, number];
    gender?: string;
    distance?: number;
  };
}