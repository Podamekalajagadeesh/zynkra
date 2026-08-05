/**
 * Integration tests for the POST /auth/signin endpoint.
 *
 * Tests the HTTP layer (routing, ValidationPipe) through supertest
 * with all service dependencies mocked.
 */

// Mock bcrypt — native C++ addon not available in CI.
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
import { EmailService } from '../src/email/email.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { WebauthnService } from '../src/auth/webauthn.service';

describe('POST /auth/signin (HTTP integration)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;

  beforeAll(async () => {
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

  // --- Successful login ---

  it('returns 200 and access_token for valid email + password', async () => {
    authService.signIn.mockResolvedValue({ access_token: 'jwt-token' });

    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.access_token).toBe('jwt-token');
    expect(authService.signIn).toHaveBeenCalledWith(
      { email: 'test@example.com', password: 'password123' },
      expect.any(Object),
    );
  });

  it('returns 200 for valid username + password', async () => {
    authService.signIn.mockResolvedValue({ access_token: 'jwt-token' });

    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        username: 'testuser',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.access_token).toBe('jwt-token');
  });

  // --- Validation errors ---

  it('returns 400 when password is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'test@example.com',
      });

    expect(response.status).toBe(400);
    expect(authService.signIn).not.toHaveBeenCalled();
  });

  it('returns 400 when password is empty', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'test@example.com',
        password: '',
      });

    expect(response.status).toBe(400);
    expect(authService.signIn).not.toHaveBeenCalled();
  });

  it('returns 400 when email is invalid format', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'not-an-email',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(authService.signIn).not.toHaveBeenCalled();
  });

  // --- Service error propagation ---

  it('returns 401 when credentials are invalid', async () => {
    authService.signIn.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Invalid credentials');
  });

  it('returns 401 when email is not verified', async () => {
    authService.signIn.mockRejectedValue(
      new UnauthorizedException('Please verify your email before logging in.'),
    );

    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'unverified@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('verify your email');
  });

  it('returns 200 with twoFactorEnabled flag when 2FA is required', async () => {
    authService.signIn.mockResolvedValue({
      twoFactorEnabled: true,
      tempToken: 'temp-jwt-token',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: '2fa@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.twoFactorEnabled).toBe(true);
    expect(response.body.tempToken).toBeDefined();
  });
});
