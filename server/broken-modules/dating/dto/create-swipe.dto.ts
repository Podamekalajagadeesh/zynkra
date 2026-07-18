import { IsString, IsIn } from 'class-validator';

export class CreateSwipeDto {
  @IsString()
  swipedUserId: string;

  @IsIn(['like', 'dislike'])
  type: 'like' | 'dislike';
}