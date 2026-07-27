import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ForgotPasswordDto } from './forgot-password.dto';

describe('ForgotPasswordDto validation', () => {
  it('accepts a valid email', async () => {
    const dto = plainToInstance(ForgotPasswordDto, { email: 'test@example.com' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('rejects missing email', async () => {
    const dto = plainToInstance(ForgotPasswordDto, {});
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('rejects empty email', async () => {
    const dto = plainToInstance(ForgotPasswordDto, { email: '' });
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('rejects invalid email format', async () => {
    const dto = plainToInstance(ForgotPasswordDto, { email: 'not-an-email' });
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('rejects email without domain', async () => {
    const dto = plainToInstance(ForgotPasswordDto, { email: 'user@' });
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('accepts email with subdomain', async () => {
    const dto = plainToInstance(ForgotPasswordDto, { email: 'user@sub.example.com' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
