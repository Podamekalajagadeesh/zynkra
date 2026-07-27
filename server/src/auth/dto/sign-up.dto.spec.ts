import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SignUpDto } from './sign-up.dto';

function makeDto(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    ...overrides,
  };
}

describe('SignUpDto validation', () => {
  it('accepts a valid DTO', async () => {
    const dto = plainToInstance(SignUpDto, makeDto());
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  // --- username ---

  it('rejects missing username', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ username: undefined }));
    const errors = await validate(dto);
    const usernameError = errors.find((e) => e.property === 'username');
    expect(usernameError).toBeDefined();
  });

  it('rejects username shorter than 3 characters', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ username: 'ab' }));
    const errors = await validate(dto);
    const usernameError = errors.find((e) => e.property === 'username');
    expect(usernameError).toBeDefined();
  });

  it('rejects username longer than 50 characters', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ username: 'a'.repeat(51) }));
    const errors = await validate(dto);
    const usernameError = errors.find((e) => e.property === 'username');
    expect(usernameError).toBeDefined();
  });

  it('accepts username with exactly 3 characters', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ username: 'abc' }));
    const errors = await validate(dto);
    const usernameError = errors.find((e) => e.property === 'username');
    expect(usernameError).toBeUndefined();
  });

  it('accepts username with exactly 50 characters', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ username: 'a'.repeat(50) }));
    const errors = await validate(dto);
    const usernameError = errors.find((e) => e.property === 'username');
    expect(usernameError).toBeUndefined();
  });

  it('rejects username with special characters', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ username: 'user name!' }));
    const errors = await validate(dto);
    const usernameError = errors.find((e) => e.property === 'username');
    expect(usernameError).toBeDefined();
  });

  it('rejects username with spaces', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ username: 'user name' }));
    const errors = await validate(dto);
    const usernameError = errors.find((e) => e.property === 'username');
    expect(usernameError).toBeDefined();
  });

  it('accepts username with underscores', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ username: 'user_name' }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('accepts username with periods', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ username: 'user.name' }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('accepts username with numbers', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ username: 'user123' }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  // --- email ---

  it('rejects missing email', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ email: undefined }));
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('rejects invalid email format', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ email: 'not-an-email' }));
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('rejects email without domain', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ email: 'user@' }));
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('accepts valid email with subdomain', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ email: 'user@sub.example.com' }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  // --- password ---

  it('rejects missing password', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ password: undefined }));
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('rejects empty password', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ password: '' }));
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('rejects password shorter than 8 characters', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ password: 'short1' }));
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('accepts password with exactly 8 characters', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ password: '12345678' }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('accepts very long password', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ password: 'a'.repeat(128) }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  // --- all fields missing ---

  it('rejects completely empty object', async () => {
    const dto = plainToInstance(SignUpDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThanOrEqual(2); // at least username + email + password
  });
});
