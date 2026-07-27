import { IsString, IsNotEmpty, MaxLength, IsUUID, IsOptional } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  content: string;

  @IsUUID()
  @IsOptional()
  postId?: string;
}