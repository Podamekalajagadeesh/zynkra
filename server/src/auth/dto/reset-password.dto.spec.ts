import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ResetPasswordDto } from './reset-password.dto';

function makeDto(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    token: 'valid-reset-token',
    password: 'newpassword123',
    ...overrides,
  };
}

describe('ResetPasswordDto validation', () => {
  it('accepts a valid DTO', async () => {
    const dto = plainToInstance(ResetPasswordDto, makeDto());
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  // --- token ---

  it('rejects missing token', async () => {
    const dto = plainToInstance(ResetPasswordDto, makeDto({ token: undefined }));
    const errors = await validate(dto);
    const tokenError = errors.find((e) => e.property === 'token');
    expect(tokenError).toBeDefined();
  });

  it('rejects empty token', async () => {
    const dto = plainToInstance(ResetPasswordDto, makeDto({ token: '' }));
    const errors = await validate(dto);
    const tokenError = errors.find((e) => e.property === 'token');
    expect(tokenError).toBeDefined();
  });

  // --- password ---

  it('rejects missing password', async () => {
    const dto = plainToInstance(ResetPasswordDto, makeDto({ password: undefined }));
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('rejects empty password', async () => {
    const dto = plainToInstance(ResetPasswordDto, makeDto({ password: '' }));
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('rejects password shorter than 8 characters', async () => {
    const dto = plainToInstance(ResetPasswordDto, makeDto({ password: 'short' }));
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('accepts password with exactly 8 characters', async () => {
    const dto = plainToInstance(ResetPasswordDto, makeDto({ password: '12345678' }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('accepts very long password', async () => {
    const dto = plainToInstance(ResetPasswordDto, makeDto({ password: 'a'.repeat(128) }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('rejects completely empty object', async () => {
    const dto = plainToInstance(ResetPasswordDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThanOrEqual(2); // token + password
  });
});
