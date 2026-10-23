import { IsString, IsDateString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  // ISO 8601 strings: the global ValidationPipe transforms but does not do
  // implicit type conversion, so JSON strings would reach a @IsDate()
  // decorator unconverted and fail — @IsDateString accepts them directly.
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;

  // Mirrored from the :groupId path param by the controller — optional here
  // so correct clients are not 400'd for trusting the path.
  @IsOptional()
  @IsUUID()
  groupId?: string;
}
