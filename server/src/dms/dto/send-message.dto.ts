import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsNumber,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MediaDto {
  @IsString()
  url: string;

  @IsString()
  type: 'image' | 'video' | 'audio';
}

class VoiceNoteDto {
  @IsNumber()
  @Min(0)
  @Max(600)
  durationSeconds: number;

  @IsArray()
  @IsNumber({}, { each: true })
  waveform: number[];
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
  @ValidateNested()
  @Type(() => VoiceNoteDto)
  voiceNote?: VoiceNoteDto;

  @IsOptional()
  @IsString()
  senderPublicKey?: string;
}