import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsNumber,
  Max,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MediaDto {
  @IsString()
  url: string;

  @IsString()
  type: 'image' | 'video' | 'audio';

  /**
   * E2EE attachment algorithm tag (e.g. "xchacha20poly1305"). Present when
   * the bytes at `url` are client-side ciphertext; the decryption key never
   * reaches the server — it travels inside the Signal envelope.
   */
  @IsOptional()
  @IsString()
  enc?: string;
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
  @MaxLength(4000)
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
  @MaxLength(512)
  senderPublicKey?: string;
}
