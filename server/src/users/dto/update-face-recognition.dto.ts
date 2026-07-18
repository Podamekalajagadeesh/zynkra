import { IsBoolean } from 'class-validator';

export class UpdateFaceRecognitionDto {
  @IsBoolean()
  isFaceRecognitionEnabled: boolean;
}