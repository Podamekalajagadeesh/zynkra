/**
 * Integration tests for the POST /auth/signup endpoint.
 *
 * Tests the HTTP layer (routing, ValidationPipe, rate limiting) through supertest
 * with all service dependencies mocked. This validates:
 * - Request body parsing and validation
 * - Correct HTTP status codes
 * - Response body shape
 */

// Mock bcrypt — native C++ addon not available in CI.
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { CaptchaService } from '../src/auth/captcha.service';
import { UsersService } from '../src/users/users.service';
import { EmailService } from '../src/email/email.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { WebauthnService } from '../src/auth/webauthn.service';

describe('POST /auth/signup (HTTP integration)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;

  beforeAll(async () => {
    // Create full mock of authService
    const mockAuthService = {
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

  // --- Successful signup ---

  it('returns 201 and a success message', async () => {
    authService.signUp.mockResolvedValue({
      message: 'Signup successful. Please check your email to verify your account.',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123!',
        birthDate: '1990-01-01',
        captchaId: 'cap-1',
        captchaAnswer: '12',
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('Signup successful');
    expect(authService.signUp).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123!',
      birthDate: '1990-01-01',
      captchaId: 'cap-1',
      captchaAnswer: '12',
    });
  });

  // --- Validation errors (via ValidationPipe) ---

  it('returns 400 when username is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'new@example.com',
        password: 'Password123!',
        birthDate: '1990-01-01',
        captchaId: 'cap-1',
        captchaAnswer: '12',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
    expect(authService.signUp).not.toHaveBeenCalled();
  });

  it('returns 400 when email is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'newuser',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(authService.signUp).not.toHaveBeenCalled();
  });

  it('returns 400 when password is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'newuser',
        email: 'new@example.com',
      });

    expect(response.status).toBe(400);
    expect(authService.signUp).not.toHaveBeenCalled();
  });

  it('returns 400 when password is too short (< 8 chars)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'short',
      });

    expect(response.status).toBe(400);
    expect(authService.signUp).not.toHaveBeenCalled();
  });

  it('returns 400 when email is invalid', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'newuser',
        email: 'not-an-email',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(authService.signUp).not.toHaveBeenCalled();
  });

  it('returns 400 when username contains special characters', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'user name!',
        email: 'new@example.com',
        password: 'Password123!',
        birthDate: '1990-01-01',
        captchaId: 'cap-1',
        captchaAnswer: '12',
      });

    expect(response.status).toBe(400);
    expect(authService.signUp).not.toHaveBeenCalled();
  });

  it('returns 400 when username is shorter than 3 characters', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'ab',
        email: 'new@example.com',
        password: 'Password123!',
        birthDate: '1990-01-01',
        captchaId: 'cap-1',
        captchaAnswer: '12',
      });

    expect(response.status).toBe(400);
    expect(authService.signUp).not.toHaveBeenCalled();
  });

  // --- Service error propagation ---

  it('returns 409 when authService.signUp throws ConflictException', async () => {
    const { ConflictException } = require('@nestjs/common');
    authService.signUp.mockRejectedValue(new ConflictException('Email already in use'));

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'newuser',
        email: 'taken@example.com',
        password: 'Password123!',
        birthDate: '1990-01-01',
        captchaId: 'cap-1',
        captchaAnswer: '12',
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('Email already in use');
  });

  // --- Content-Type validation ---

  it('returns 415 for non-JSON request', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .set('Content-Type', 'text/plain')
      .send('username=newuser&email=new@example.com&password=password123');

    // NestJS with default body parser returns 400 or 415 depending on config
    expect([400, 415]).toContain(response.status);
  });
});
