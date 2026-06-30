import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(['group', 'broadcast'])
  type?: 'group' | 'broadcast';
}