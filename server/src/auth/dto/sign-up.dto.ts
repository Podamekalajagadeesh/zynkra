import { IsEmail, IsNotEmpty, MinLength, IsString, Length, Matches } from 'class-validator';

export class SignUpDto {
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and periods.',
  })
  username: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}