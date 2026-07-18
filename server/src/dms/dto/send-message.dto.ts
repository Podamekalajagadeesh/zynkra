import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MediaDto {
  @IsString()
  url: string;

  @IsString()
  type: 'image' | 'video' | 'audio';
}

export class SendMessageDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  media?: MediaDto[];

  @IsOptional()
  @IsString()
  senderPublicKey?: string;
}