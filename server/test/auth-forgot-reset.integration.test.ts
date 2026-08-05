/**
 * Integration tests for POST /auth/forgot-password and POST /auth/reset-password.
 *
 * Tests the HTTP layer through supertest with all service dependencies mocked.
 * NOTE: Both endpoints now use DTO classes (ForgotPasswordDto, ResetPasswordDto)
 * so the ValidationPipe rejects missing/invalid fields with 400.
 */

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, UnauthorizedException, BadRequestException } from '@nestjs/common';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { CaptchaService } from '../src/auth/captcha.service';
import { UsersService } from '../src/users/users.service';
import { WebauthnService } from '../src/auth/webauthn.service';

function createMockAuthService() {
  return {
    signUp: jest.fn(),
    signIn: jest.fn(),
    verifyEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    resendVerification: jest.fn(),
    setup2FA: jest.fn(),
    enable2FA: jest.fn(),
    verify2FALogin: jest.fn(),
    get2FAStatus: jest.fn(),
    disable2FA: jest.fn(),
    generateRecoveryCodes: jest.fn(),
    recoverAccount: jest.fn(),
    getRecoveryOptions: jest.fn(),
    getTrustedRecoveryContacts: jest.fn(),
    setTrustedRecoveryContacts: jest.fn(),
    requestTrustedContactRecovery: jest.fn(),
    verifyTrustedContactRecovery: jest.fn(),
    getLoginSessions: jest.fn(),
    getPendingLoginSessions: jest.fn(),
    approveLoginSession: jest.fn(),
    revokeLoginSession: jest.fn(),
    revokeAllOtherSessions: jest.fn(),
    socialLogin: jest.fn(),
    validateUser: jest.fn(),
    login: jest.fn(),
  };
}

describe('POST /auth/forgot-password (HTTP integration)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;

  beforeAll(async () => {
    const mockAuthService = createMockAuthService();

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: WebauthnService,
          useValue: {
            getRegistrationOptions: jest.fn(),
            verifyRegistration: jest.fn(),
            getAuthenticationOptions: jest.fn(),
            verifyAuthentication: jest.fn(),
            getPasskeys: jest.fn(),
            deletePasskey: jest.fn(),
            updateAuthenticatorCounter: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: { findOneById: jest.fn() },
        },
        {
          provide: CaptchaService,
          useValue: { generate: jest.fn(), verify: jest.fn().mockReturnValue(true) },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    authService = moduleRef.get(AuthService) as jest.Mocked<AuthService>;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Successful forgot password ---

  it('returns success message for valid email', async () => {
    authService.forgotPassword.mockResolvedValue({
      message: 'If a user with that email exists, a password reset link has been sent.',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('password reset link');
    expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com');
  });

  // --- DTO validation ---

  it('returns 400 when email is missing (DTO validation)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({});

    expect(response.status).toBe(400);
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('returns 400 when email is invalid format (DTO validation)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('returns 200 for valid email', async () => {
    authService.forgotPassword.mockResolvedValue({
      message: 'If a user with that email exists, a password reset link has been sent.',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'anyone@example.com' });

    expect(response.status).toBe(201);
    expect(authService.forgotPassword).toHaveBeenCalledWith('anyone@example.com');
  });

  // --- Service error propagation ---

  it('propagates service errors', async () => {
    authService.forgotPassword.mockRejectedValue(new Error('Email service down'));

    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(500);
  });
});

describe('POST /auth/reset-password (HTTP integration)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;

  beforeAll(async () => {
    const mockAuthService = createMockAuthService();

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: WebauthnService,
          useValue: {
            getRegistrationOptions: jest.fn(),
            verifyRegistration: jest.fn(),
            getAuthenticationOptions: jest.fn(),
            verifyAuthentication: jest.fn(),
            getPasskeys: jest.fn(),
            deletePasskey: jest.fn(),
            updateAuthenticatorCounter: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: { findOneById: jest.fn() },
        },
        {
          provide: CaptchaService,
          useValue: { generate: jest.fn(), verify: jest.fn().mockReturnValue(true) },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    authService = moduleRef.get(AuthService) as jest.Mocked<AuthService>;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Successful reset ---

  it('returns success for valid token + password', async () => {
    authService.resetPassword.mockResolvedValue({
      message: 'Password has been reset successfully.',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'valid-token', password: 'newpassword123' });

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('Password has been reset');
    expect(authService.resetPassword).toHaveBeenCalledWith('valid-token', 'newpassword123');
  });

  // --- DTO validation ---

  it('returns 400 when token is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ password: 'newpassword123' });

    expect(response.status).toBe(400);
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('returns 400 when password is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'valid-token' });

    expect(response.status).toBe(400);
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('returns 400 when password is too short', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'valid-token', password: 'short' });

    expect(response.status).toBe(400);
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  // --- Service error propagation ---

  it('returns 401 for invalid token', async () => {
    authService.resetPassword.mockRejectedValue(
      new UnauthorizedException('Invalid or expired password reset token.'),
    );

    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'expired-token', password: 'newpassword123' });

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Invalid or expired');
  });

  it('propagates unexpected errors as 500', async () => {
    authService.resetPassword.mockRejectedValue(new Error('Database error'));

    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'some-token', password: 'newpassword123' });

    expect(response.status).toBe(500);
  });
});
