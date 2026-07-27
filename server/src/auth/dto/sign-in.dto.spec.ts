import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SignInDto } from './sign-in.dto';

function makeDto(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    email: 'test@example.com',
    password: 'password123',
    ...overrides,
  };
}

describe('SignInDto validation', () => {
  it('accepts a valid DTO with email + password', async () => {
    const dto = plainToInstance(SignInDto, makeDto());
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('accepts a valid DTO with username + password', async () => {
    const dto = plainToInstance(SignInDto, makeDto({ email: undefined, username: 'testuser' }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('accepts a DTO with only password (email/username optional)', async () => {
    const dto = plainToInstance(SignInDto, makeDto({ email: undefined, username: undefined }));
    const errors = await validate(dto);
    // password is required but email/username are optional
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeUndefined();
  });

  // --- email ---

  it('rejects invalid email format', async () => {
    const dto = plainToInstance(SignInDto, makeDto({ email: 'not-an-email' }));
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('accepts missing email (username login)', async () => {
    const dto = plainToInstance(SignInDto, makeDto({ email: undefined, username: 'testuser' }));
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeUndefined();
  });

  // --- password ---

  it('rejects missing password', async () => {
    const dto = plainToInstance(SignInDto, makeDto({ password: undefined }));
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('rejects empty password', async () => {
    const dto = plainToInstance(SignInDto, makeDto({ password: '' }));
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('accepts password of any length (no minlength on signin)', async () => {
    const dto = plainToInstance(SignInDto, makeDto({ password: 'a' }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
