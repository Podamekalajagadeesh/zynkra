import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(['text', 'image', 'video', 'audio'])
  @IsOptional()
  type?: 'text' | 'image' | 'video' | 'audio';

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsUUID()
  @IsOptional()
  replyToId?: string;
}