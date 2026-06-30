import { IsString, IsBoolean, IsDate, IsOptional, IsUUID } from 'class-validator';

export class CreateTodoItemDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsUUID()
  groupId: string;
}