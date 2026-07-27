import { IsEnum } from 'class-validator';

export class BestTimeDto {
  @IsEnum(['post', 'reel', 'story', 'article'])
  contentType: string;
}
