import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

export class CreateModMailConversationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsUUID()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  initialMessage: string;
}
