import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateModMailConversationDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsUUID()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  initialMessage: string;
}
