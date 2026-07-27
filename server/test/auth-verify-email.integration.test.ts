/**
 * Integration tests for GET /auth/verify-email/:token and POST /auth/resend-verification.
 *
 * Tests the HTTP layer through supertest with all service dependencies mocked.
 */

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
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

describe('GET /auth/verify-email/:token (HTTP integration)', () => {
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

  // --- Successful verification ---

  it('returns 200 and access_token for valid token', async () => {
    authService.verifyEmail.mockResolvedValue({ access_token: 'jwt-token' });

    const response = await request(app.getHttpServer())
      .get('/auth/verify-email/valid-token-123');

    expect(response.status).toBe(200);
    expect(response.body.access_token).toBe('jwt-token');
    expect(authService.verifyEmail).toHaveBeenCalledWith('valid-token-123', expect.any(Object));
  });

  // --- Invalid token ---

  it('returns 401 for invalid token', async () => {
    authService.verifyEmail.mockRejectedValue(
      new UnauthorizedException('Invalid verification token'),
    );

    const response = await request(app.getHttpServer())
      .get('/auth/verify-email/invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Invalid verification token');
  });

  // --- Expired token ---

  it('returns 401 for expired token', async () => {
    authService.verifyEmail.mockRejectedValue(
      new UnauthorizedException('Verification token has expired'),
    );

    const response = await request(app.getHttpServer())
      .get('/auth/verify-email/expired-token');

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('expired');
  });
});

describe('POST /auth/resend-verification (HTTP integration)', () => {
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

  // --- Successful resend ---

  it('returns success for valid email', async () => {
    authService.resendVerification.mockResolvedValue({
      message: 'If a user with that email exists, a verification email has been sent.',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('verification email has been sent');
    expect(authService.resendVerification).toHaveBeenCalledWith('test@example.com');
  });

  // --- Edge cases (service handles security) ---

  it('returns same message for non-existent user (no user enumeration)', async () => {
    authService.resendVerification.mockResolvedValue({
      message: 'If a user with that email exists, a verification email has been sent.',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email: 'nonexistent@example.com' });

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('verification email has been sent');
  });

  it('returns same message for already verified user', async () => {
    authService.resendVerification.mockResolvedValue({
      message: 'If a user with that email exists, a verification email has been sent.',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email: 'already-verified@example.com' });

    expect(response.status).toBe(201);
  });
});
