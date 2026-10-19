// bcrypt native binary is not compiled in this environment; mock before any imports.
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { WebauthnService } from './webauthn.service';
import { UsersService } from '../users/users.service';
import { AccountLinkingService } from '../features/account-management/account-linking.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let usersService: jest.Mocked<UsersService>;
  let webauthnService: jest.Mocked<WebauthnService>;
  let captchaService: jest.Mocked<CaptchaService>;
  let accountLinkingService: jest.Mocked<AccountLinkingService>;
  let configService: jest.Mocked<ConfigService>;

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
            requestMagicLink: jest.fn(),
            verifyMagicLink: jest.fn(),
            refreshFromToken: jest.fn(),
            reactivateAndSignIn: jest.fn(),
            guestSignIn: jest.fn(),
            anonymousSignIn: jest.fn(),
            verifyByCode: jest.fn(),
            getBrainwaveDevices: jest.fn(),
            registerBrainwaveDevice: jest.fn(),
            removeBrainwaveDevice: jest.fn(),
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
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
          },
        },
        {
          provide: AccountLinkingService,
          useValue: {
            verifyOAuthState: jest.fn(),
            linkOAuthAccount: jest.fn(),
            createOAuthState: jest.fn(),
            getOAuthStartUrl: jest.fn(),
            getUserLinkedAccounts: jest.fn(),
            linkAccount: jest.fn(),
            getLinkedAccount: jest.fn(),
            unlinkAccount: jest.fn(),
            setPrimaryAccount: jest.fn(),
          },
        },
        {
          provide: CaptchaService,
          useValue: {
            generate: jest.fn().mockResolvedValue({ id: 'cap-1', expression: '1 + 1' }),
            verify: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((_k: string, fallback?: string) => fallback) },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    webauthnService = module.get(WebauthnService) as jest.Mocked<WebauthnService>;
    captchaService = module.get(CaptchaService) as jest.Mocked<CaptchaService>;
    accountLinkingService = module.get(AccountLinkingService) as jest.Mocked<AccountLinkingService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  // ─── POST /auth/signup ────────────────────────────────────────────────

  describe('POST /auth/signup', () => {
    it('calls authService.signUp with the DTO', async () => {
      const dto = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        birthDate: '1990-01-01',
        captchaId: 'cap-1',
        captchaAnswer: '12',
      };
      authService.signUp.mockResolvedValue({
        message: 'Signup successful. Please check your email to verify your account.',
      });

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
      authService.forgotPassword.mockResolvedValue({
        message: 'If a user with that email exists, a password reset link has been sent.',
      });

      const result = await controller.forgotPassword({ email: 'test@example.com' });

      expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(result.message).toContain('password reset link');
    });
  });

  // ─── POST /auth/reset-password ────────────────────────────────────────

  describe('POST /auth/reset-password', () => {
    it('calls authService.resetPassword', async () => {
      authService.resetPassword.mockResolvedValue({
        message: 'Password has been reset successfully.',
      });

      const result = await controller.resetPassword({
        token: 'reset-token',
        password: 'newpassword123',
      });

      expect(authService.resetPassword).toHaveBeenCalledWith('reset-token', 'newpassword123');
      expect(result.message).toContain('Password has been reset');
    });
  });

  // ─── POST /auth/resend-verification ───────────────────────────────────

  describe('POST /auth/resend-verification', () => {
    it('calls authService.resendVerification', async () => {
      authService.resendVerification.mockResolvedValue({
        message: 'If a user with that email exists, a verification email has been sent.',
      });

      const result = await controller.resendVerification({ email: 'test@example.com' });

      expect(authService.resendVerification).toHaveBeenCalledWith('test@example.com');
    });
  });

  // ─── 2FA endpoints ────────────────────────────────────────────────────

  describe('2FA endpoints', () => {
    it('POST /auth/2fa/setup', async () => {
      authService.setup2FA.mockResolvedValue({
        secret: 'ABC123',
        otpauthUrl: 'otpauth://totp/...',
      });

      const result = await controller.setupTwoFactor({ user: { userId: 'user-1' } }, {});

      expect(authService.setup2FA).toHaveBeenCalledWith('user-1', undefined);
      expect(result.otpauthUrl).toContain('otpauth://');
    });

    it('POST /auth/2fa/enable', async () => {
      authService.enable2FA.mockResolvedValue({ message: 'Two-factor authentication enabled.' });

      const result = await controller.enableTwoFactor(
        { user: { userId: 'user-1' } },
        { token: '123456' }
      );

      expect(authService.enable2FA).toHaveBeenCalledWith('user-1', '123456');
    });

    it('POST /auth/2fa/verify', async () => {
      authService.verify2FALogin.mockResolvedValue({
        access_token: 'jwt-token',
        refresh_token: 'refresh-token',
      });

      const result = await controller.verifyTwoFactor({} as any, {
        tempToken: 'temp',
        token: '123456',
      });

      expect(authService.verify2FALogin).toHaveBeenCalledWith('temp', '123456', {});
    });

    it('GET /auth/2fa/status', async () => {
      authService.get2FAStatus.mockResolvedValue({ enabled: true, hasSecret: true });

      const result = await controller.getTwoFactorStatus({ user: { userId: 'user-1' } });

      expect(authService.get2FAStatus).toHaveBeenCalledWith('user-1');
    });

    it('POST /auth/2fa/disable', async () => {
      authService.disable2FA.mockResolvedValue({ message: 'Two-factor authentication disabled.' });

      const result = await controller.disableTwoFactor(
        { user: { userId: 'user-1' } },
        { token: '123456' }
      );

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

      const result = await controller.getSessions({
        user: { userId: 'user-1', sessionId: 'current-session' },
      });

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

  // ─── Magic link ────────────────────────────────────────────────────────

  describe('magic link', () => {
    it('POST /auth/magic-link/request calls authService.requestMagicLink with the email', async () => {
      authService.requestMagicLink.mockResolvedValue({ message: 'Sign-in link sent.' });

      const result = await controller.requestMagicLink({ email: 'test@example.com' });

      expect(authService.requestMagicLink).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual({ message: 'Sign-in link sent.' });
    });

    it('POST /auth/magic-link/verify calls authService.verifyMagicLink with the token and req', async () => {
      authService.verifyMagicLink.mockResolvedValue({ access_token: 'jwt' });

      const req = { headers: { 'user-agent': 'test' } };
      const result = await controller.verifyMagicLink(req as any, { token: 'abc' });

      expect(authService.verifyMagicLink).toHaveBeenCalledWith('abc', req);
      expect(result).toEqual({ access_token: 'jwt' });
    });
  });

  // ─── WebAuthn biometric / remember-me passthrough ─────────────────────

  describe('WebAuthn authentication', () => {
    it('passes biometric to the webauthn service', async () => {
      const user = { id: 'user-1', email: 'test@example.com' };
      authService.validateUser.mockResolvedValue(user as any);
      webauthnService.getAuthenticationOptions.mockResolvedValue({ challenge: 'c' } as any);

      await controller.getWebAuthnAuthenticationOptions(
        { email: 'test@example.com', biometric: true },
        {} as any
      );

      expect(webauthnService.getAuthenticationOptions).toHaveBeenCalledWith(user, {
        biometric: true,
      });
    });

    it('passes rememberMe to the login call after a successful verification', async () => {
      const user = { id: 'user-1' };
      usersService.findOneById.mockResolvedValue(user as any);
      webauthnService.verifyAuthentication.mockResolvedValue({
        verified: true,
        authenticationInfo: {},
      } as any);
      authService.login.mockResolvedValue({ access_token: 'jwt' } as any);

      const result = await controller.verifyWebAuthnAuthentication(
        { rememberMe: true } as any,
        { userId: 'user-1', challenge: 'c' } as any
      );

      expect(authService.login).toHaveBeenCalledWith(user, undefined, true);
      expect(result).toEqual({ access_token: 'jwt' });
    });

    it('defaults biometric to false when the body omits it', async () => {
      const user = { id: 'user-1', email: 'test@example.com' };
      authService.validateUser.mockResolvedValue(user as any);
      webauthnService.getAuthenticationOptions.mockResolvedValue({ challenge: 'c' } as any);
      const session: Record<string, any> = {};

      await controller.getWebAuthnAuthenticationOptions(
        { email: 'test@example.com' } as any,
        session as any
      );

      expect(webauthnService.getAuthenticationOptions).toHaveBeenCalledWith(user, {
        biometric: false,
      });
      expect(session.challenge).toBe('c');
      expect(session.userId).toBe('user-1');
    });

    it('rejects when the session has no userId', async () => {
      await expect(
        controller.verifyWebAuthnAuthentication({} as any, { challenge: 'c' } as any)
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the session has no challenge', async () => {
      await expect(
        controller.verifyWebAuthnAuthentication({} as any, { userId: 'user-1' } as any)
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the user no longer exists for the session', async () => {
      usersService.findOneById.mockResolvedValue(null as any);

      await expect(
        controller.verifyWebAuthnAuthentication(
          {} as any,
          { userId: 'user-1', challenge: 'c' } as any
        )
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(usersService.findOneById).toHaveBeenCalledWith('user-1');
    });

    it('rejects when the authenticator verification fails', async () => {
      usersService.findOneById.mockResolvedValue({ id: 'user-1' } as any);
      webauthnService.verifyAuthentication.mockResolvedValue({ verified: false } as any);

      await expect(
        controller.verifyWebAuthnAuthentication(
          {} as any,
          { userId: 'user-1', challenge: 'c' } as any
        )
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('updates the authenticator counter and clears the session after success', async () => {
      const user = { id: 'user-1' };
      usersService.findOneById.mockResolvedValue(user as any);
      webauthnService.verifyAuthentication.mockResolvedValue({
        verified: true,
        authenticationInfo: { counter: 7 },
      } as any);
      webauthnService.updateAuthenticatorCounter.mockResolvedValue(undefined as any);
      authService.login.mockResolvedValue({ access_token: 'jwt' } as any);
      const session: Record<string, any> = { userId: 'user-1', challenge: 'c' };

      const result = await controller.verifyWebAuthnAuthentication({} as any, session as any);

      expect(webauthnService.updateAuthenticatorCounter).toHaveBeenCalledWith({ counter: 7 });
      expect(authService.login).toHaveBeenCalledWith(user, undefined, false);
      expect(session.challenge).toBeUndefined();
      expect(session.userId).toBeUndefined();
      expect(result).toEqual({ access_token: 'jwt' });
    });
  });

  // ─── GET /auth/csrf-token ─────────────────────────────────────────────

  describe('GET /auth/csrf-token', () => {
    it('issues a token, stores it in the session, and mirrors it to cookie + header', () => {
      const session: Record<string, any> = {};
      const res = { cookie: jest.fn(), setHeader: jest.fn() };

      const result = controller.csrfToken(session as any, res as any);

      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
      expect(session.csrfToken).toBe(result.token);
      expect(res.cookie).toHaveBeenCalledWith(
        'zynkra.csrf',
        result.token,
        expect.objectContaining({ httpOnly: false, secure: false, sameSite: 'lax', path: '/' })
      );
      expect(res.setHeader).toHaveBeenCalledWith('x-csrf-token', result.token);
    });

    it('reuses the existing session token instead of minting a new one', () => {
      const session: Record<string, any> = { csrfToken: 'existing-token' };
      const res = { cookie: jest.fn(), setHeader: jest.fn() };

      const result = controller.csrfToken(session as any, res as any);

      expect(result.token).toBe('existing-token');
      expect(session.csrfToken).toBe('existing-token');
      expect(res.cookie).toHaveBeenCalledWith('zynkra.csrf', 'existing-token', expect.any(Object));
    });

    it('marks the cookie secure when NODE_ENV is production', () => {
      configService.get.mockImplementation((key: string, fallback?: string) =>
        key === 'NODE_ENV' ? 'production' : fallback
      );
      const res = { cookie: jest.fn(), setHeader: jest.fn() };

      controller.csrfToken({} as any, res as any);

      expect(res.cookie).toHaveBeenCalledWith(
        'zynkra.csrf',
        expect.any(String),
        expect.objectContaining({ secure: true })
      );
    });
  });

  // ─── OAuth start handlers (no-op bodies behind passport guards) ───────

  describe('OAuth account-link start handlers', () => {
    it('GET /auth/google is a no-op', async () => {
      await expect(controller.googleAuth()).resolves.toBeUndefined();
    });

    it('GET /auth/link/google is a no-op', () => {
      expect(controller.startGoogleAccountLink()).toBeUndefined();
    });

    it('GET /auth/link/facebook is a no-op', () => {
      expect(controller.startFacebookAccountLink()).toBeUndefined();
    });

    it('GET /auth/link/github is a no-op', () => {
      expect(controller.startGitHubAccountLink()).toBeUndefined();
    });

    it('GET /auth/link/discord is a no-op', () => {
      expect(controller.startDiscordAccountLink()).toBeUndefined();
    });

    it('GET /auth/link/twitter is a no-op', () => {
      expect(controller.startTwitterAccountLink()).toBeUndefined();
    });

    it('GET /auth/link/apple is a no-op', () => {
      expect(controller.startAppleAccountLink()).toBeUndefined();
    });
  });

  // ─── OAuth callbacks ──────────────────────────────────────────────────

  describe('OAuth callbacks', () => {
    it('GET /auth/google/callback without state starts a social login', async () => {
      const req = { query: {}, user: { id: 'user-1' } };
      const res = { redirect: jest.fn() };
      authService.socialLogin.mockResolvedValue({ access_token: 'jwt' } as any);

      await controller.googleAuthRedirect(req as any, res as any);

      expect(authService.socialLogin).toHaveBeenCalledWith(req, res);
      expect(accountLinkingService.verifyOAuthState).not.toHaveBeenCalled();
    });

    it('GET /auth/google/callback with state links the Google account', async () => {
      const req = { query: { state: 'state-token' }, user: { id: 'user-1' } };
      const res = { redirect: jest.fn() };
      accountLinkingService.verifyOAuthState.mockReturnValue('user-1');
      accountLinkingService.linkOAuthAccount.mockResolvedValue(undefined as any);

      await controller.googleAuthRedirect(req as any, res as any);

      expect(accountLinkingService.verifyOAuthState).toHaveBeenCalledWith('state-token', 'google');
      expect(accountLinkingService.linkOAuthAccount).toHaveBeenCalledWith(
        'user-1',
        'google',
        req.user
      );
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/settings?linked=google');
      expect(authService.socialLogin).not.toHaveBeenCalled();
    });

    it('GET /auth/link/google/callback links the Google account', async () => {
      const req = { query: { state: 'state-token' }, user: { id: 'user-1' } };
      const res = { redirect: jest.fn() };
      accountLinkingService.verifyOAuthState.mockReturnValue('user-1');
      accountLinkingService.linkOAuthAccount.mockResolvedValue(undefined as any);

      await controller.googleAccountLinkCallback(req as any, res as any);

      expect(accountLinkingService.verifyOAuthState).toHaveBeenCalledWith('state-token', 'google');
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/settings?linked=google');
    });

    it('GET /auth/link/facebook/callback links the Facebook account', async () => {
      const req = { query: { state: 'state-token' }, user: { id: 'user-1' } };
      const res = { redirect: jest.fn() };
      accountLinkingService.verifyOAuthState.mockReturnValue('user-1');
      accountLinkingService.linkOAuthAccount.mockResolvedValue(undefined as any);

      await controller.facebookAccountLinkCallback(req as any, res as any);

      expect(accountLinkingService.verifyOAuthState).toHaveBeenCalledWith(
        'state-token',
        'facebook'
      );
      expect(accountLinkingService.linkOAuthAccount).toHaveBeenCalledWith(
        'user-1',
        'facebook',
        req.user
      );
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/settings?linked=facebook');
    });

    it('GET /auth/link/github/callback links the GitHub account', async () => {
      const req = { query: { state: 'state-token' }, user: { id: 'user-1' } };
      const res = { redirect: jest.fn() };
      accountLinkingService.verifyOAuthState.mockReturnValue('user-1');
      accountLinkingService.linkOAuthAccount.mockResolvedValue(undefined as any);

      await controller.githubAccountLinkCallback(req as any, res as any);

      expect(accountLinkingService.verifyOAuthState).toHaveBeenCalledWith('state-token', 'github');
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/settings?linked=github');
    });

    it('GET /auth/link/discord/callback links the Discord account', async () => {
      const req = { query: { state: 'state-token' }, user: { id: 'user-1' } };
      const res = { redirect: jest.fn() };
      accountLinkingService.verifyOAuthState.mockReturnValue('user-1');
      accountLinkingService.linkOAuthAccount.mockResolvedValue(undefined as any);

      await controller.discordAccountLinkCallback(req as any, res as any);

      expect(accountLinkingService.verifyOAuthState).toHaveBeenCalledWith('state-token', 'discord');
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/settings?linked=discord');
    });

    it('GET /auth/link/twitter/callback links the Twitter account', async () => {
      const req = { query: { state: 'state-token' }, user: { id: 'user-1' } };
      const res = { redirect: jest.fn() };
      accountLinkingService.verifyOAuthState.mockReturnValue('user-1');
      accountLinkingService.linkOAuthAccount.mockResolvedValue(undefined as any);

      await controller.twitterAccountLinkCallback(req as any, res as any);

      expect(accountLinkingService.verifyOAuthState).toHaveBeenCalledWith('state-token', 'twitter');
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/settings?linked=twitter');
    });

    it('GET /auth/link/apple/callback links the Apple account', async () => {
      const req = { query: { state: 'state-token' }, user: { id: 'user-1' } };
      const res = { redirect: jest.fn() };
      accountLinkingService.verifyOAuthState.mockReturnValue('user-1');
      accountLinkingService.linkOAuthAccount.mockResolvedValue(undefined as any);

      await controller.appleAccountLinkCallback(req as any, res as any);

      expect(accountLinkingService.verifyOAuthState).toHaveBeenCalledWith('state-token', 'apple');
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/settings?linked=apple');
    });

    it('redirects to CLIENT_URL when it is configured', async () => {
      const previous = process.env.CLIENT_URL;
      process.env.CLIENT_URL = 'https://app.example.com';
      try {
        const req = { query: { state: 'state-token' }, user: { id: 'user-1' } };
        const res = { redirect: jest.fn() };
        accountLinkingService.verifyOAuthState.mockReturnValue('user-1');
        accountLinkingService.linkOAuthAccount.mockResolvedValue(undefined as any);

        await controller.githubAccountLinkCallback(req as any, res as any);

        expect(res.redirect).toHaveBeenCalledWith('https://app.example.com/settings?linked=github');
      } finally {
        if (previous === undefined) {
          delete process.env.CLIENT_URL;
        } else {
          process.env.CLIENT_URL = previous;
        }
      }
    });

    it('propagates an invalid OAuth state error from the linking service', async () => {
      const req = { query: { state: 'bad-state' }, user: { id: 'user-1' } };
      const res = { redirect: jest.fn() };
      accountLinkingService.verifyOAuthState.mockImplementation(() => {
        throw new BadRequestException('Invalid OAuth state.');
      });

      await expect(
        controller.googleAccountLinkCallback(req as any, res as any)
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(accountLinkingService.linkOAuthAccount).not.toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });
  });

  // ─── Brainwave devices ────────────────────────────────────────────────

  describe('brainwave devices', () => {
    it('GET /auth/brainwave/devices lists devices for the user', async () => {
      authService.getBrainwaveDevices.mockResolvedValue([{ id: 'dev-1' }] as any);

      const result = await controller.getBrainwaveDevices({ user: { userId: 'user-1' } } as any);

      expect(authService.getBrainwaveDevices).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
    });

    it('POST /auth/brainwave/devices/register passes the device model', async () => {
      authService.registerBrainwaveDevice.mockResolvedValue({ id: 'dev-1' } as any);

      await controller.registerBrainwaveDevice({ user: { userId: 'user-1' } } as any, {
        deviceModel: 'Muse S',
      });

      expect(authService.registerBrainwaveDevice).toHaveBeenCalledWith('user-1', 'Muse S');
    });

    it('POST /auth/brainwave/devices/register tolerates a missing body', async () => {
      authService.registerBrainwaveDevice.mockResolvedValue({ id: 'dev-1' } as any);

      await controller.registerBrainwaveDevice(
        { user: { userId: 'user-1' } } as any,
        undefined as any
      );

      expect(authService.registerBrainwaveDevice).toHaveBeenCalledWith('user-1', undefined);
    });

    it('DELETE /auth/brainwave/devices/:id removes the device', async () => {
      authService.removeBrainwaveDevice.mockResolvedValue({ message: 'Device removed.' } as any);

      const result = await controller.removeBrainwaveDevice(
        { user: { userId: 'user-1' } } as any,
        'dev-1'
      );

      expect(authService.removeBrainwaveDevice).toHaveBeenCalledWith('user-1', 'dev-1');
      expect(result).toHaveProperty('message');
    });
  });

  // ─── Account recovery ─────────────────────────────────────────────────

  describe('account recovery', () => {
    it('POST /auth/recover calls authService.recoverAccount', async () => {
      authService.recoverAccount.mockResolvedValue({ access_token: 'jwt' } as any);
      const req = { headers: { 'user-agent': 'test' } };

      const result = await controller.recoverAccount(req as any, {
        identifier: 'test@example.com',
        recoveryCode: 'ABCD-EFGH',
      });

      expect(authService.recoverAccount).toHaveBeenCalledWith('test@example.com', 'ABCD-EFGH', req);
      expect(result).toHaveProperty('access_token');
    });

    it('GET /auth/recovery/trusted-contacts returns the stored contacts', async () => {
      authService.getTrustedRecoveryContacts.mockResolvedValue(['a@example.com'] as any);

      const result = await controller.getTrustedRecoveryContacts({
        user: { userId: 'user-1' },
      } as any);

      expect(authService.getTrustedRecoveryContacts).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
    });

    it('POST /auth/recovery/trusted-contacts saves the provided contacts', async () => {
      authService.setTrustedRecoveryContacts.mockResolvedValue({
        contacts: ['a@example.com'],
      } as any);

      await controller.setTrustedRecoveryContacts({ user: { userId: 'user-1' } } as any, {
        contacts: ['a@example.com'],
      });

      expect(authService.setTrustedRecoveryContacts).toHaveBeenCalledWith('user-1', [
        'a@example.com',
      ]);
    });

    it('POST /auth/recovery/trusted-contacts defaults to an empty list when contacts are missing', async () => {
      authService.setTrustedRecoveryContacts.mockResolvedValue({ contacts: [] } as any);

      await controller.setTrustedRecoveryContacts({ user: { userId: 'user-1' } } as any, {} as any);

      expect(authService.setTrustedRecoveryContacts).toHaveBeenCalledWith('user-1', []);
    });

    it('POST /auth/recovery/contact/request sends the trusted-contact recovery email', async () => {
      authService.requestTrustedContactRecovery.mockResolvedValue({ message: 'Code sent.' } as any);

      const result = await controller.requestTrustedContactRecovery({
        identifier: 'test@example.com',
        contactEmail: 'friend@example.com',
      });

      expect(authService.requestTrustedContactRecovery).toHaveBeenCalledWith(
        'test@example.com',
        'friend@example.com'
      );
      expect(result).toHaveProperty('message');
    });

    it('POST /auth/recovery/contact/verify verifies the trusted-contact code', async () => {
      authService.verifyTrustedContactRecovery.mockResolvedValue({ access_token: 'jwt' } as any);
      const req = { headers: { 'user-agent': 'test' } };

      const result = await controller.verifyTrustedContactRecovery(req as any, {
        identifier: 'test@example.com',
        contactEmail: 'friend@example.com',
        code: '123456',
      });

      expect(authService.verifyTrustedContactRecovery).toHaveBeenCalledWith(
        'test@example.com',
        'friend@example.com',
        '123456',
        req
      );
      expect(result).toHaveProperty('access_token');
    });

    it('GET /auth/recovery/options falls back to an empty identifier', async () => {
      authService.getRecoveryOptions.mockResolvedValue({ methods: {} } as any);

      await controller.getRecoveryOptions(undefined as any);

      expect(authService.getRecoveryOptions).toHaveBeenCalledWith('');
    });
  });

  // ─── GET /auth/captcha ────────────────────────────────────────────────

  describe('GET /auth/captcha', () => {
    it('returns the generated arithmetic challenge', async () => {
      const result = await controller.captcha();

      expect(captchaService.generate).toHaveBeenCalled();
      expect(result).toEqual({ id: 'cap-1', expression: '1 + 1' });
    });
  });

  // ─── Availability checks ──────────────────────────────────────────────

  describe('availability checks', () => {
    it('GET /auth/check-email reports availability when no user matches', async () => {
      usersService.findByEmail.mockResolvedValue(null as any);

      const result = await controller.checkEmailAvailability('free@example.com');

      expect(usersService.findByEmail).toHaveBeenCalledWith('free@example.com');
      expect(result).toEqual({ available: true });
    });

    it('GET /auth/check-email reports taken when a user matches', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'user-1' } as any);

      const result = await controller.checkEmailAvailability('taken@example.com');

      expect(result).toEqual({ available: false });
    });

    it('GET /auth/check-username reports availability when no user matches', async () => {
      usersService.findByUsername.mockResolvedValue(null as any);

      const result = await controller.checkUsernameAvailability('freeuser');

      expect(usersService.findByUsername).toHaveBeenCalledWith('freeuser');
      expect(result).toEqual({ available: true });
    });

    it('GET /auth/check-username reports taken when a user matches', async () => {
      usersService.findByUsername.mockResolvedValue({ id: 'user-1' } as any);

      const result = await controller.checkUsernameAvailability('takenuser');

      expect(result).toEqual({ available: false });
    });
  });

  // ─── POST /auth/verify-code ───────────────────────────────────────────

  describe('POST /auth/verify-code', () => {
    it('calls authService.verifyByCode with email, code, and req', async () => {
      authService.verifyByCode.mockResolvedValue({ access_token: 'jwt' } as any);
      const req = { headers: { 'user-agent': 'test' } };

      const result = await controller.verifyByCode(req as any, {
        email: 'test@example.com',
        code: '123456',
      });

      expect(authService.verifyByCode).toHaveBeenCalledWith('test@example.com', '123456', req);
      expect(result).toHaveProperty('access_token');
    });
  });

  // ─── POST /auth/reactivate ────────────────────────────────────────────

  describe('POST /auth/reactivate', () => {
    it('calls authService.reactivateAndSignIn with the DTO and req', async () => {
      authService.reactivateAndSignIn.mockResolvedValue({ access_token: 'jwt' } as any);
      const dto = { email: 'test@example.com', password: 'password123' };
      const req = { headers: { 'user-agent': 'test' } };

      const result = await controller.reactivate(req as any, dto);

      expect(authService.reactivateAndSignIn).toHaveBeenCalledWith(dto, req);
      expect(result).toHaveProperty('access_token');
    });
  });

  // ─── POST /auth/refresh ───────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('uses the refresh_token from the body when present', async () => {
      authService.refreshFromToken.mockResolvedValue({ access_token: 'a' } as any);

      const result = await controller.refresh(
        { headers: {} } as any,
        { refresh_token: 'body-token' } as any
      );

      expect(authService.refreshFromToken).toHaveBeenCalledWith('body-token');
      expect(result).toEqual({ access_token: 'a' });
    });

    it('trims surrounding whitespace from the body token', async () => {
      authService.refreshFromToken.mockResolvedValue({ access_token: 'a' } as any);

      await controller.refresh(
        { headers: {} } as any,
        { refresh_token: '  padded-token  ' } as any
      );

      expect(authService.refreshFromToken).toHaveBeenCalledWith('padded-token');
    });

    it('falls back to the Authorization bearer token when the body has none', async () => {
      authService.refreshFromToken.mockResolvedValue({ access_token: 'a' } as any);

      await controller.refresh(
        { headers: { authorization: 'Bearer header-token' } } as any,
        {} as any
      );

      expect(authService.refreshFromToken).toHaveBeenCalledWith('header-token');
    });

    it('falls back to the bearer token when the body token is blank', async () => {
      authService.refreshFromToken.mockResolvedValue({ access_token: 'a' } as any);

      await controller.refresh(
        { headers: { authorization: 'Bearer header-token' } } as any,
        { refresh_token: '   ' } as any
      );

      expect(authService.refreshFromToken).toHaveBeenCalledWith('header-token');
    });

    it('rejects when no token is supplied at all', async () => {
      await expect(controller.refresh({ headers: {} } as any, {} as any)).rejects.toThrow(
        BadRequestException
      );
      expect(authService.refreshFromToken).not.toHaveBeenCalled();
    });

    it('rejects when the request has no headers and no body', async () => {
      await expect(controller.refresh({} as any, undefined as any)).rejects.toThrow(
        'A refresh token is required.'
      );
      expect(authService.refreshFromToken).not.toHaveBeenCalled();
    });
  });

  // ─── Guest / anonymous sign-in ────────────────────────────────────────

  describe('guest and anonymous sign-in', () => {
    it('POST /auth/guest calls authService.guestSignIn with the request', async () => {
      authService.guestSignIn.mockResolvedValue({ access_token: 'guest-jwt' } as any);
      const req = { headers: { 'user-agent': 'test' } };

      const result = await controller.createGuestUser(req);

      expect(authService.guestSignIn).toHaveBeenCalledWith(req);
      expect(result).toEqual({ access_token: 'guest-jwt' });
    });

    it('POST /auth/anonymous calls authService.anonymousSignIn with the request', async () => {
      authService.anonymousSignIn.mockResolvedValue({ access_token: 'anon-jwt' } as any);
      const req = { headers: { 'user-agent': 'test' } };

      const result = await controller.createAnonymousUser(req);

      expect(authService.anonymousSignIn).toHaveBeenCalledWith(req);
      expect(result).toEqual({ access_token: 'anon-jwt' });
    });
  });

  // ─── WebAuthn registration ────────────────────────────────────────────

  describe('WebAuthn registration', () => {
    it('stores the challenge in the session and returns the options', async () => {
      webauthnService.getRegistrationOptions.mockResolvedValue({
        challenge: 'chal-1',
        rp: { name: 'FathussX' },
      } as any);
      const session: Record<string, any> = {};
      const user = { userId: 'user-1', email: 'test@example.com' };

      const options = await controller.getWebAuthnRegistrationOptions(
        { user } as any,
        session as any
      );

      expect(webauthnService.getRegistrationOptions).toHaveBeenCalledWith(user);
      expect(session.challenge).toBe('chal-1');
      expect(options.challenge).toBe('chal-1');
    });

    it('verify registration passes user, body, and the session challenge', async () => {
      webauthnService.verifyRegistration.mockResolvedValue({ verified: true } as any);
      const user = { userId: 'user-1' };
      const body = { id: 'cred-1', rawId: 'raw-1' };

      const result = await controller.verifyWebAuthnRegistration(
        { user } as any,
        body as any,
        { challenge: 'chal-1' } as any
      );

      expect(webauthnService.verifyRegistration).toHaveBeenCalledWith(user, body, 'chal-1');
      expect(result).toEqual({ verified: true });
    });
  });

  // ─── Passkeys and session inventory ───────────────────────────────────

  describe('passkeys and session inventory', () => {
    it('GET /auth/webauthn/passkeys lists passkeys for the user', async () => {
      webauthnService.getPasskeys.mockResolvedValue([{ id: 'cred-1' }] as any);
      const user = { userId: 'user-1', id: 'user-1' };

      const result = await controller.getPasskeys({ user } as any);

      expect(webauthnService.getPasskeys).toHaveBeenCalledWith(user);
      expect(result).toHaveLength(1);
    });

    it('DELETE /auth/webauthn/passkeys/:id deletes the passkey', async () => {
      webauthnService.deletePasskey.mockResolvedValue({ message: 'Passkey deleted.' } as any);
      const user = { userId: 'user-1', id: 'user-1' };

      const result = await controller.deletePasskey({ user } as any, 'cred-1');

      expect(webauthnService.deletePasskey).toHaveBeenCalledWith(user, 'cred-1');
      expect(result).toHaveProperty('message');
    });

    it('GET /auth/sessions/pending lists pending sessions', async () => {
      authService.getPendingLoginSessions.mockResolvedValue([{ id: 'sess-1' }] as any);

      const result = await controller.getPendingSessions({ user: { userId: 'user-1' } } as any);

      expect(authService.getPendingLoginSessions).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
    });

    it('POST /auth/sessions/revoke-all revokes all other sessions', async () => {
      authService.revokeAllOtherSessions.mockResolvedValue({ revoked: 3 } as any);

      const result = await controller.revokeAllSessions({
        user: { userId: 'user-1', sessionId: 'current-session' },
      } as any);

      expect(authService.revokeAllOtherSessions).toHaveBeenCalledWith('user-1', 'current-session');
      expect(result).toHaveProperty('revoked');
    });
  });
});
