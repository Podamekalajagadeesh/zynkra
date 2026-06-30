import { IsOptional, IsUUID } from 'class-validator';

export class UpdateBookmarkDto {
  @IsOptional()
  @IsUUID()
  collectionId?: string;
}