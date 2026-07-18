import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SignInDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsNotEmpty()
  password: string;
}