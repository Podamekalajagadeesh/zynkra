import { IsString, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  content: string;

  @IsUUID()
  @IsNotEmpty()
  postId: string;
}