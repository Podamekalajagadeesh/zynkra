/**
 * Integration tests for the POST /auth/signout endpoint.
 *
 * Tests the HTTP layer (routing, JWT guard, session revocation) through supertest
 * with all service dependencies mocked.
 */

// Mock bcrypt — native C++ addon not available in CI.
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { EmailService } from '../src/email/email.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { WebauthnService } from '../src/auth/webauthn.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { LoginSession } from '../src/auth/entities/login-session.entity';

describe('POST /auth/signout (HTTP integration)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const mockAuthService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
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
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: 'test-secret' }),
      ],
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
        { provide: ConfigService, useValue: { get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined) } },
        {
          provide: getRepositoryToken(LoginSession),
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 's1', revokedAt: null }),
            find: jest.fn().mockResolvedValue([]),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        JwtStrategy,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    authService = moduleRef.get(AuthService) as jest.Mocked<AuthService>;
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Happy path ---

  it('returns 200 and success message when signed out', async () => {
    authService.signOut.mockResolvedValue({ message: 'Signed out successfully.' });
    const token = jwtService.sign({ sub: 'user-1', sid: 's1' });

    const response = await request(app.getHttpServer())
      .post('/auth/signout')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Signed out successfully.');
    expect(authService.signOut).toHaveBeenCalledWith('s1');
  });

  // --- JWT guard ---

  it('returns 401 when Authorization header is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signout');

    expect(response.status).toBe(401);
    expect(authService.signOut).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signout')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(authService.signOut).not.toHaveBeenCalled();
  });

  it('returns 401 when session is revoked', async () => {
    // The LoginSession mock returns a session with revokedAt: null by default.
    // Override it to return a revoked session.
    const loginSessionRepo = app.get(getRepositoryToken(LoginSession));
    loginSessionRepo.findOne.mockResolvedValue({ id: 's1', revokedAt: new Date() });

    const token = jwtService.sign({ sub: 'user-1', sid: 's1' });

    const response = await request(app.getHttpServer())
      .post('/auth/signout')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
  });
});
