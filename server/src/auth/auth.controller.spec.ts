// bcrypt native binary is not compiled in this environment; mock before any imports.
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { WebauthnService } from './webauthn.service';
import { UsersService } from '../users/users.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
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
            signOut: jest.fn(),
            revokeAllOtherSessions: jest.fn(),
            socialLogin: jest.fn(),
            validateUser: jest.fn(),
            login: jest.fn(),
          },
        },
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
          useValue: {
            findOneById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  // ─── POST /auth/signup ────────────────────────────────────────────────

  describe('POST /auth/signup', () => {
    it('calls authService.signUp with the DTO', async () => {
      const dto = { username: 'newuser', email: 'new@example.com', password: 'password123' };
      authService.signUp.mockResolvedValue({ message: 'Signup successful. Please check your email to verify your account.' });

      const result = await controller.signUp(dto);

      expect(authService.signUp).toHaveBeenCalledWith(dto);
      expect(result.message).toContain('Signup successful');
    });
  });

  // ─── POST /auth/signin ────────────────────────────────────────────────

  describe('POST /auth/signin', () => {
    it('calls authService.signIn and returns the result', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const req = { headers: { 'user-agent': 'test' } };
      authService.signIn.mockResolvedValue({ access_token: 'jwt-token' } as any);

      const result = await controller.signIn(req as any, dto);

      expect(authService.signIn).toHaveBeenCalledWith(dto, req);
      expect(result).toHaveProperty('access_token', 'jwt-token');
    });
  });

  // ─── GET /auth/verify-email/:token ────────────────────────────────────

  describe('GET /auth/verify-email/:token', () => {
    it('calls authService.verifyEmail', async () => {
      authService.verifyEmail.mockResolvedValue({ access_token: 'jwt-token' });

      const result = await controller.verifyEmail({} as any, 'valid-token');

      expect(authService.verifyEmail).toHaveBeenCalledWith('valid-token', {});
      expect(result).toHaveProperty('access_token');
    });
  });

  // ─── POST /auth/forgot-password ───────────────────────────────────────

  describe('POST /auth/forgot-password', () => {
    it('calls authService.forgotPassword', async () => {
      authService.forgotPassword.mockResolvedValue({ message: 'If a user with that email exists, a password reset link has been sent.' });

      const result = await controller.forgotPassword({ email: 'test@example.com' });

      expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(result.message).toContain('password reset link');
    });
  });

  // ─── POST /auth/reset-password ────────────────────────────────────────

  describe('POST /auth/reset-password', () => {
    it('calls authService.resetPassword', async () => {
      authService.resetPassword.mockResolvedValue({ message: 'Password has been reset successfully.' });

      const result = await controller.resetPassword({ token: 'reset-token', password: 'newpassword123' });

      expect(authService.resetPassword).toHaveBeenCalledWith('reset-token', 'newpassword123');
      expect(result.message).toContain('Password has been reset');
    });
  });

  // ─── POST /auth/resend-verification ───────────────────────────────────

  describe('POST /auth/resend-verification', () => {
    it('calls authService.resendVerification', async () => {
      authService.resendVerification.mockResolvedValue({ message: 'If a user with that email exists, a verification email has been sent.' });

      const result = await controller.resendVerification({ email: 'test@example.com' });

      expect(authService.resendVerification).toHaveBeenCalledWith('test@example.com');
    });
  });

  // ─── 2FA endpoints ────────────────────────────────────────────────────

  describe('2FA endpoints', () => {
    it('POST /auth/2fa/setup', async () => {
      authService.setup2FA.mockResolvedValue({ secret: 'ABC123', otpauthUrl: 'otpauth://totp/...' });

      const result = await controller.setupTwoFactor({ user: { userId: 'user-1' } });

      expect(authService.setup2FA).toHaveBeenCalledWith('user-1');
      expect(result.otpauthUrl).toContain('otpauth://');
    });

    it('POST /auth/2fa/enable', async () => {
      authService.enable2FA.mockResolvedValue({ message: 'Two-factor authentication enabled.' });

      const result = await controller.enableTwoFactor({ user: { userId: 'user-1' } }, { token: '123456' });

      expect(authService.enable2FA).toHaveBeenCalledWith('user-1', '123456');
    });

    it('POST /auth/2fa/verify', async () => {
      authService.verify2FALogin.mockResolvedValue({ access_token: 'jwt-token' });

      const result = await controller.verifyTwoFactor({} as any, { tempToken: 'temp', token: '123456' });

      expect(authService.verify2FALogin).toHaveBeenCalledWith('temp', '123456', {});
    });

    it('GET /auth/2fa/status', async () => {
      authService.get2FAStatus.mockResolvedValue({ enabled: true, hasSecret: true });

      const result = await controller.getTwoFactorStatus({ user: { userId: 'user-1' } });

      expect(authService.get2FAStatus).toHaveBeenCalledWith('user-1');
    });

    it('POST /auth/2fa/disable', async () => {
      authService.disable2FA.mockResolvedValue({ message: 'Two-factor authentication disabled.' });

      const result = await controller.disableTwoFactor({ user: { userId: 'user-1' } }, { token: '123456' });

      expect(authService.disable2FA).toHaveBeenCalledWith('user-1', '123456');
    });
  });

  // ─── Recovery codes ───────────────────────────────────────────────────

  describe('POST /auth/recovery-codes', () => {
    it('calls authService.generateRecoveryCodes', async () => {
      authService.generateRecoveryCodes.mockResolvedValue({ codes: ['ABCD-EFGH'] });

      const result = await controller.generateRecoveryCodes({ user: { userId: 'user-1' } });

      expect(authService.generateRecoveryCodes).toHaveBeenCalledWith('user-1');
      expect(result.codes).toHaveLength(1);
    });
  });

  // ─── Sessions ─────────────────────────────────────────────────────────

  describe('session management', () => {
    it('GET /auth/sessions', async () => {
      authService.getLoginSessions.mockResolvedValue([]);

      const result = await controller.getSessions({ user: { userId: 'user-1', sessionId: 'current-session' } });

      expect(authService.getLoginSessions).toHaveBeenCalledWith('user-1', 'current-session');
    });

    it('POST /auth/sessions/:id/approve', async () => {
      authService.approveLoginSession.mockResolvedValue({ message: 'Session approved.' });

      const result = await controller.approveSession({ user: { userId: 'user-1' } }, 'session-id');

      expect(authService.approveLoginSession).toHaveBeenCalledWith('user-1', 'session-id');
    });

    it('POST /auth/sessions/:id/revoke', async () => {
      authService.revokeLoginSession.mockResolvedValue({ message: 'Session revoked.' });

      const result = await controller.revokeSession({ user: { userId: 'user-1' } }, 'session-id');

      expect(authService.revokeLoginSession).toHaveBeenCalledWith('user-1', 'session-id');
    });

    it('POST /auth/signout', async () => {
      authService.signOut.mockResolvedValue({ message: 'Signed out successfully.' });

      const result = await controller.signOut({ user: { sessionId: 'current-session' } });

      expect(authService.signOut).toHaveBeenCalledWith('current-session');
      expect(result.message).toBe('Signed out successfully.');
    });

    it('POST /auth/signout passes undefined when no sessionId', async () => {
      authService.signOut.mockResolvedValue({ message: 'Signed out successfully.' });

      const result = await controller.signOut({ user: {} });

      expect(authService.signOut).toHaveBeenCalledWith(undefined);
    });
  });

  // ─── Recovery contacts ────────────────────────────────────────────────

  describe('GET /auth/recovery/options', () => {
    it('calls authService.getRecoveryOptions', async () => {
      authService.getRecoveryOptions.mockResolvedValue({
        methods: { passwordReset: true, recoveryCodes: false, trustedContacts: [] },
      });

      const result = await controller.getRecoveryOptions('test@example.com' as any);

      expect(authService.getRecoveryOptions).toHaveBeenCalledWith('test@example.com');
    });
  });
});
