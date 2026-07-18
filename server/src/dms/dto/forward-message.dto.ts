import { IsString } from 'class-validator';

export class ForwardMessageDto {
  @IsString()
  conversationId?: string;

  @IsString()
  channelId?: string;
}