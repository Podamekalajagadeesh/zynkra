import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SignUpDto } from './sign-up.dto';

function makeDto(overrides: Record<string, any> = {}) {
  return {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!',
    birthDate: '1990-01-01',
    captchaId: 'captcha-id-1',
    captchaAnswer: '12',
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

  it('rejects username with special characters', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ username: 'user name!' }));
    const errors = await validate(dto);
    const usernameError = errors.find((e) => e.property === 'username');
    expect(usernameError).toBeDefined();
  });

  it('accepts username with underscores and periods', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ username: 'user.name_123' }));
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

  // --- password strength ---

  it('rejects missing password', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ password: undefined }));
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('rejects password shorter than 8 characters', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ password: 'Short1!' }));
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('rejects password with fewer than 3 character classes', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ password: 'password123' }));
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('accepts password with 3 character classes and 8 characters', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ password: 'Abcd1234' }));
    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeUndefined();
  });

  it('accepts very long strong password', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ password: 'Abcd1234!'.repeat(16) }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  // --- birthDate ---

  it('rejects missing birthDate', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ birthDate: undefined }));
    const errors = await validate(dto);
    const birthDateError = errors.find((e) => e.property === 'birthDate');
    expect(birthDateError).toBeDefined();
  });

  it('rejects birthDate in wrong format', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ birthDate: '01/01/1990' }));
    const errors = await validate(dto);
    const birthDateError = errors.find((e) => e.property === 'birthDate');
    expect(birthDateError).toBeDefined();
  });

  it('accepts birthDate in YYYY-MM-DD format', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ birthDate: '2005-06-15' }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  // --- captcha ---

  it('rejects missing captchaId', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ captchaId: undefined }));
    const errors = await validate(dto);
    const captchaError = errors.find((e) => e.property === 'captchaId');
    expect(captchaError).toBeDefined();
  });

  it('rejects missing captchaAnswer', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ captchaAnswer: undefined }));
    const errors = await validate(dto);
    const captchaError = errors.find((e) => e.property === 'captchaAnswer');
    expect(captchaError).toBeDefined();
  });

  // --- invite code (optional) ---

  it('accepts a DTO without an invite code', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ inviteCode: undefined }));
    const errors = await validate(dto);
    const inviteError = errors.find((e) => e.property === 'inviteCode');
    expect(inviteError).toBeUndefined();
  });

  it('accepts a valid invite code', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ inviteCode: 'ABC12345' }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('rejects an invite code that is too short', async () => {
    const dto = plainToInstance(SignUpDto, makeDto({ inviteCode: 'AB' }));
    const errors = await validate(dto);
    const inviteError = errors.find((e) => e.property === 'inviteCode');
    expect(inviteError).toBeDefined();
  });

  // --- all fields missing ---

  it('rejects completely empty object', async () => {
    const dto = plainToInstance(SignUpDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
