import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  recipientIds: string[];

  @IsString()
  @IsOptional()
  name?: string;
}