import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, Validate } from 'class-validator';
import { PasswordStrengthValidator } from './password-strength.validator';

export class SignUpDto {
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and periods.',
  })
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Validate(PasswordStrengthValidator)
  password: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'birthDate must be in YYYY-MM-DD format',
  })
  birthDate: string;

  @IsString()
  @IsNotEmpty({ message: 'captchaId is required' })
  captchaId: string;

  @IsString()
  @IsNotEmpty({ message: 'captchaAnswer is required' })
  captchaAnswer: string;

  @IsOptional()
  @IsString()
  @Length(4, 64)
  inviteCode?: string;
}
