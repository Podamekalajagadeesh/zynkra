import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateBookmarkDto {
  @IsNotEmpty()
  @IsUUID()
  postId: string;

  @IsOptional()
  @IsUUID()
  collectionId?: string;
}