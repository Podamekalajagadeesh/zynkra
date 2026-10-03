import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SignInDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

  /**
   * Optional CAPTCHA. Only enforced when `CAPTCHA_REQUIRED_ON_SIGNIN=true`.
   * An anti-bot speed bump, not proof of a human — the expression is returned
   * to the client, so scripts can solve it.
   */
  @IsOptional()
  @IsString()
  captchaId?: string;

  @IsOptional()
  @IsString()
  captchaAnswer?: string;
}

export class VerifyCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class VerifyTwoFactorLoginDto {
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class TwoFactorSetupDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  token?: string;
}

export class TwoFactorTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refresh_token?: string;
}