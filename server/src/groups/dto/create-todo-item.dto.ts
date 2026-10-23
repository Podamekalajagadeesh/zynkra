import { IsString, IsBoolean, IsDateString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateTodoItemDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  // ISO 8601 string — @IsDate() would 400 because the global pipe does not
  // implicitly convert strings to Date.
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  // Mirrored from the :groupId path param by the controller.
  @IsOptional()
  @IsUUID()
  groupId?: string;
}
