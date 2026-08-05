import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

// Mock crypto.createHash so hashRecoveryCode returns deterministic values.
jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    createHash: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('aabbccdd11223344'),
    })),
  };
});
import { NotificationsService } from '../notifications/notifications.service';
import { LoginSession } from './entities/login-session.entity';
import { User } from '../users/entities/user.entity';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { CaptchaService } from './captcha.service';
import { InviteCodesService } from '../invite-codes/invite-codes.service';

// Mock bcrypt entirely — it's a native C++ addon and we don't want real hashing.
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn(),
}));

const bcrypt = require('bcrypt');

// ---- Factory helpers ----

function makeUser(overrides: Partial<User> = {}): User {
  const user = new User();
  Object.assign(user, {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'testuser',
    email: 'test@example.com',
    password_hash: '$2b$10$hashedpassword',
    emailVerified: false,
    emailVerificationToken: 'valid-token',
    emailVerificationTokenExpires: new Date(Date.now() + 3600_000),
    passwordResetToken: null,
    passwordResetTokenExpires: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    recoveryCodeHashes: null,
    recoveryCodesGeneratedAt: null,
    trustedRecoveryContacts: [],
    trustedRecoveryCodeHash: null,
    trustedRecoveryCodeExpiresAt: null,
    banned: false,
    role: 'user' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
  return user;
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let emailService: jest.Mocked<EmailService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let loginSessionRepo: jest.Mocked<Repository<LoginSession>>;
  let captchaServiceMock: { verify: jest.Mock; generate: jest.Mock };

  beforeEach(async () => {
    // Reset bcrypt mock state
    jest.clearAllMocks();
    captchaServiceMock = {
      verify: jest.fn().mockReturnValue(true),
      generate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            findOneById: jest.fn(),
            findByEmailVerificationToken: jest.fn(),
            findByMagicLinkTokenHash: jest.fn(),
            findByPasswordResetToken: jest.fn(),
            createUser: jest.fn(),
            save: jest.fn(),
            setPasswordResetToken: jest.fn(),
            findOrCreate: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('jwt-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'CLIENT_URL') return 'http://localhost:5173';
              return defaultValue;
            }),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationCode: jest.fn().mockResolvedValue(undefined),
            sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
            sendLoginAlertEmail: jest.fn().mockResolvedValue(undefined),
            sendTrustedRecoveryCodeEmail: jest.fn().mockResolvedValue(undefined),
            sendNotificationEmail: jest.fn().mockResolvedValue(undefined),
            sendMagicLinkEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LoginSession),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: CaptchaService,
          useValue: captchaServiceMock,
        },
        {
          provide: InviteCodesService,
          useValue: {
            findByCode: jest.fn(),
            isUsable: jest.fn().mockReturnValue(false),
            consume: jest.fn().mockResolvedValue(true),
            generateCode: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    emailService = module.get(EmailService) as jest.Mocked<EmailService>;
    notificationsService = module.get(NotificationsService) as jest.Mocked<NotificationsService>;
    loginSessionRepo = module.get(getRepositoryToken(LoginSession)) as jest.Mocked<Repository<LoginSession>>;
  });

  // ─── signUp ───────────────────────────────────────────────────────────

  describe('signUp', () => {
    const dto: SignUpDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      birthDate: '1990-01-01',
      captchaId: 'cap-1',
      captchaAnswer: '12',
    };

    it('creates a user and sends a verification email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(makeUser({ username: 'newuser', email: 'new@example.com' }));

      const result = await service.signUp(dto);

      expect(result.message).toContain('Signup successful');
      expect(usersService.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(usersService.findByUsername).toHaveBeenCalledWith('newuser');
      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newuser',
          email: 'new@example.com',
          password_hash: '$2b$10$hashedpassword',
          birthDate: '1990-01-01',
          birthDateVerifiedAt: expect.any(Date),
          emailVerificationToken: expect.any(String),
          emailVerificationTokenExpires: expect.any(Date),
        }),
      );
      expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
        'new@example.com',
        expect.any(String),
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('throws ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser());

      await expect(service.signUp(dto)).rejects.toThrow(ConflictException);
      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('throws ConflictException when username already exists', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(makeUser());

      await expect(service.signUp(dto)).rejects.toThrow(ConflictException);
      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('propagates error when UsersService.createUser fails', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.createUser.mockRejectedValue(new Error('Database error'));

      await expect(service.signUp(dto)).rejects.toThrow('Database error');
    });

    it('does not fail signup when EmailService.sendVerificationCode fails', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(makeUser({ username: 'newuser', email: 'new@example.com' }));
      emailService.sendVerificationCode.mockRejectedValue(new Error('Email send failed'));

      // User creation succeeded but email failed — signup must still succeed.
      const result = await service.signUp(dto);
      expect(result.message).toContain('Signup successful');
      expect(usersService.createUser).toHaveBeenCalledTimes(1);
    });

    it('throws BadRequestException when the captcha is invalid', async () => {
      captchaServiceMock.verify.mockReturnValueOnce(false);

      await expect(service.signUp(dto)).rejects.toThrow(BadRequestException);
      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the user is under the minimum age', async () => {
      const underageDto: SignUpDto = {
        ...dto,
        birthDate: '2020-01-01',
      };
      await expect(service.signUp(underageDto)).rejects.toThrow(BadRequestException);
      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('works with username that has underscores and periods', async () => {
      const dtoWithSpecial: SignUpDto = {
        username: 'test_user.name',
        email: 'special@example.com',
        password: 'password123',
        birthDate: '1990-01-01',
        captchaId: 'cap-1',
        captchaAnswer: '12',
      };

      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(makeUser({ username: 'test_user.name', email: 'special@example.com' }));

      await service.signUp(dtoWithSpecial);

      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'test_user.name' }),
      );
    });

    it('throws error when bcrypt.hash fails', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockRejectedValueOnce(new Error('Hashing failed'));

      await expect(service.signUp(dto)).rejects.toThrow('Hashing failed');
      expect(usersService.createUser).not.toHaveBeenCalled();
    });
  });

  // ─── signIn ───────────────────────────────────────────────────────────

  describe('signIn', () => {
    const dto: SignInDto = { email: 'test@example.com', password: 'password123' };

    it('returns a JWT for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser({ emailVerified: true }));
      bcrypt.compare.mockResolvedValue(true);
      loginSessionRepo.create.mockReturnValue({ id: 'session-1' } as any);
      loginSessionRepo.save.mockResolvedValue({ id: 'session-1' } as any);

      const result = await service.signIn(dto, { headers: { 'user-agent': 'test' } });

      expect(result).toHaveProperty('access_token', 'jwt-token');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('throws UnauthorizedException for wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser({ emailVerified: true }));
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when email is not verified', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser({ emailVerified: false }));
      bcrypt.compare.mockResolvedValue(true);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('returns a temp token when 2FA is enabled', async () => {
      const user = makeUser({ emailVerified: true, twoFactorEnabled: true, twoFactorSecret: 'secret' });
      usersService.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.signIn(dto);

      expect(result).toHaveProperty('twoFactorEnabled', true);
      expect(result).toHaveProperty('tempToken');
    });

    it('throws UnauthorizedException for non-existent user', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws BadRequestException when no email or username is provided', async () => {
      const { BadRequestException } = require('@nestjs/common');
      const emptyDto: SignInDto = { email: undefined as any, username: undefined as any, password: 'password123' };

      await expect(service.signIn(emptyDto)).rejects.toThrow(BadRequestException);
    });

    it('can sign in with username instead of email', async () => {
      const dtoUsername: SignInDto = { username: 'testuser', password: 'password123' };
      usersService.findByUsername.mockResolvedValue(makeUser({ emailVerified: true }));
      bcrypt.compare.mockResolvedValue(true);
      loginSessionRepo.create.mockReturnValue({ id: 'session-2' } as any);
      loginSessionRepo.save.mockResolvedValue({ id: 'session-2' } as any);

      const result = await service.signIn(dtoUsername);

      expect(result).toHaveProperty('access_token');
      expect(usersService.findByUsername).toHaveBeenCalledWith('testuser');
    });
  });

  // ─── verifyEmail ──────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('marks the user as verified for a valid token', async () => {
      const user = makeUser({ emailVerified: false });
      usersService.findByEmailVerificationToken.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);
      loginSessionRepo.create.mockReturnValue({ id: 'session-3' } as any);
      loginSessionRepo.save.mockResolvedValue({ id: 'session-3' } as any);

      const result = await service.verifyEmail('valid-token');

      expect(result).toHaveProperty('access_token');
      expect(user.emailVerified).toBe(true);
      expect(usersService.save).toHaveBeenCalledWith(user);
    });

    it('throws UnauthorizedException for invalid token', async () => {
      usersService.findByEmailVerificationToken.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for expired token', async () => {
      const user = makeUser({
        emailVerificationTokenExpires: new Date(Date.now() - 1000), // expired
      });
      usersService.findByEmailVerificationToken.mockResolvedValue(user);

      await expect(service.verifyEmail('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('clears verification token and expiry after successful verification', async () => {
      const user = makeUser({ emailVerified: false });
      usersService.findByEmailVerificationToken.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);
      loginSessionRepo.create.mockReturnValue({ id: 'session-4' } as any);
      loginSessionRepo.save.mockResolvedValue({ id: 'session-4' } as any);

      await service.verifyEmail('valid-token');

      expect(user.emailVerificationToken).toBeNull();
      expect(user.emailVerificationTokenExpires).toBeNull();
    });

    it('issues a JWT access token after verification', async () => {
      const user = makeUser({ emailVerified: false });
      usersService.findByEmailVerificationToken.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);
      loginSessionRepo.create.mockReturnValue({ id: 'session-5' } as any);
      loginSessionRepo.save.mockResolvedValue({ id: 'session-5' } as any);

      const result = await service.verifyEmail('valid-token');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: user.id }),
        expect.anything(),
      );
      expect(result.access_token).toBe('jwt-token');
    });

    it('propagates error when usersService.save fails', async () => {
      const user = makeUser({ emailVerified: false });
      usersService.findByEmailVerificationToken.mockResolvedValue(user);
      usersService.save.mockRejectedValue(new Error('DB error'));

      await expect(service.verifyEmail('valid-token')).rejects.toThrow('DB error');
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('sends a reset email for an existing user', async () => {
      const user = makeUser();
      usersService.findByEmail.mockResolvedValue(user);
      usersService.setPasswordResetToken.mockResolvedValue();

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('If a user with that email exists');
      expect(usersService.setPasswordResetToken).toHaveBeenCalledWith(
        user.id,
        expect.any(String),
        expect.any(Date),
      );
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
    });

    it('returns the same message for non-existent user (security)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result.message).toContain('If a user with that email exists');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('generates a 64-char hex token', async () => {
      const user = makeUser();
      usersService.findByEmail.mockResolvedValue(user);
      usersService.setPasswordResetToken.mockResolvedValue();

      await service.forgotPassword('test@example.com');

      const [, token, expires] = usersService.setPasswordResetToken.mock.calls[0];
      expect(token).toHaveLength(64); // 32 bytes hex
      expect(expires).toBeInstanceOf(Date);
      expect(expires.getTime()).toBeGreaterThan(Date.now()); // expires in the future
    });

    it('propagates error when emailService.sendPasswordResetEmail fails', async () => {
      const user = makeUser();
      usersService.findByEmail.mockResolvedValue(user);
      usersService.setPasswordResetToken.mockResolvedValue();
      emailService.sendPasswordResetEmail.mockRejectedValue(new Error('Email failed'));

      await expect(service.forgotPassword('test@example.com')).rejects.toThrow('Email failed');
      // Token was already saved before email failed
      expect(usersService.setPasswordResetToken).toHaveBeenCalledTimes(1);
    });
  });

  // ─── resetPassword ────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('updates the password for a valid token', async () => {
      const user = makeUser({
        passwordResetToken: 'reset-token',
        passwordResetTokenExpires: new Date(Date.now() + 3600_000),
      });
      usersService.findByPasswordResetToken.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);

      const result = await service.resetPassword('reset-token', 'newpassword123');

      expect(result.message).toContain('Password has been reset');
      expect(usersService.save).toHaveBeenCalled();
    });

    it('throws UnauthorizedException for invalid token', async () => {
      usersService.findByPasswordResetToken.mockResolvedValue(null);

      await expect(service.resetPassword('bad-token', 'newpassword123')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for expired token', async () => {
      const user = makeUser({
        passwordResetToken: 'expired-token',
        passwordResetTokenExpires: new Date(Date.now() - 1000), // expired
      });
      usersService.findByPasswordResetToken.mockResolvedValue(user);

      await expect(service.resetPassword('expired-token', 'newpassword123')).rejects.toThrow(UnauthorizedException);
      expect(usersService.save).not.toHaveBeenCalled();
    });

    it('clears the reset token and expiry after successful reset', async () => {
      const user = makeUser({
        passwordResetToken: 'reset-token',
        passwordResetTokenExpires: new Date(Date.now() + 3600_000),
      });
      usersService.findByPasswordResetToken.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);

      await service.resetPassword('reset-token', 'newpassword123');

      expect(user.passwordResetToken).toBeNull();
      expect(user.passwordResetTokenExpires).toBeNull();
      expect(usersService.save).toHaveBeenCalledWith(user);
    });

    it('hashes the new password with bcrypt', async () => {
      const user = makeUser({
        passwordResetToken: 'reset-token',
        passwordResetTokenExpires: new Date(Date.now() + 3600_000),
      });
      usersService.findByPasswordResetToken.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);

      await service.resetPassword('reset-token', 'newpassword123');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
    });

    it('propagates error when bcrypt.hash fails', async () => {
      const user = makeUser({
        passwordResetToken: 'reset-token',
        passwordResetTokenExpires: new Date(Date.now() + 3600_000),
      });
      usersService.findByPasswordResetToken.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'hash').mockRejectedValueOnce(new Error('Hash failed'));

      await expect(service.resetPassword('reset-token', 'newpassword123')).rejects.toThrow('Hash failed');
      expect(usersService.save).not.toHaveBeenCalled();
    });
  });

  // ─── resendVerification ───────────────────────────────────────────────

  describe('resendVerification', () => {
    it('resends verification email for an existing unverified user', async () => {
      const user = makeUser({ emailVerified: false });
      usersService.findByEmail.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);

      const result = await service.resendVerification('test@example.com');

      expect(result.message).toContain('verification code has been sent');
      expect(emailService.sendVerificationCode).toHaveBeenCalledWith('test@example.com', expect.any(String));
    });

    it('returns generic message for non-existent user (security)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.resendVerification('unknown@example.com');

      expect(result.message).toContain('a verification email has been sent');
      expect(emailService.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('returns generic message for already verified user (security)', async () => {
      const user = makeUser({ emailVerified: true });
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.resendVerification('verified@example.com');

      expect(result.message).toContain('a verification email has been sent');
      expect(emailService.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('generates a new token and saves it for unverified user', async () => {
      const user = makeUser({ emailVerified: false, emailVerificationToken: 'old-token' });
      usersService.findByEmail.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);

      await service.resendVerification('test@example.com');

      expect(user.emailVerificationToken).toBeDefined();
      expect(user.emailVerificationToken).toMatch(/^\d{6}$/); // 6-digit code
      expect(user.emailVerificationToken).not.toBe('old-token'); // new token
      expect(user.emailVerificationTokenExpires).toBeInstanceOf(Date);
      expect(user.emailVerificationTokenExpires!.getTime()).toBeGreaterThan(Date.now());
      expect(usersService.save).toHaveBeenCalledWith(user);
    });

    it('propagates error when emailService.sendVerificationCode fails', async () => {
      const user = makeUser({ emailVerified: false });
      usersService.findByEmail.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);
      emailService.sendVerificationCode.mockRejectedValue(new Error('Email failed'));

      await expect(service.resendVerification('test@example.com')).rejects.toThrow('Email failed');
      // Token was already saved before email failed
      expect(usersService.save).toHaveBeenCalledTimes(1);
    });

    it('propagates error when usersService.save fails', async () => {
      const user = makeUser({ emailVerified: false });
      usersService.findByEmail.mockResolvedValue(user);
      usersService.save.mockRejectedValue(new Error('DB error'));

      await expect(service.resendVerification('test@example.com')).rejects.toThrow('DB error');
    });
  });

  // ─── 2FA ──────────────────────────────────────────────────────────────

  describe('2FA', () => {
    it('setup2FA generates a secret and returns an otpauth URL', async () => {
      const user = makeUser();
      usersService.findOneById.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);

      const result = await service.setup2FA(user.id);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('otpauthUrl');
      expect(result.otpauthUrl).toContain('otpauth://totp/');
      expect(user.twoFactorSecret).toBeTruthy();
      expect(user.twoFactorEnabled).toBe(false);
    });

    it('setup2FA throws NotFoundException for missing user', async () => {
      usersService.findOneById.mockResolvedValue(null);
      await expect(service.setup2FA('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('enable2FA throws UnauthorizedException for invalid token', async () => {
      const user = makeUser({ twoFactorSecret: 'ABCDEFGHIJKLMNOP' });
      usersService.findOneById.mockResolvedValue(user);

      await expect(service.enable2FA(user.id, '000000')).rejects.toThrow(UnauthorizedException);
    });

    it('disable2FA throws UnauthorizedException for invalid token', async () => {
      const user = makeUser({ twoFactorEnabled: true, twoFactorSecret: 'ABCDEFGHIJKLMNOP' });
      usersService.findOneById.mockResolvedValue(user);

      await expect(service.disable2FA(user.id, '000000')).rejects.toThrow(UnauthorizedException);
    });

    it('get2FAStatus returns correct status', async () => {
      const user = makeUser({ twoFactorEnabled: true, twoFactorSecret: 'secret' });
      usersService.findOneById.mockResolvedValue(user);

      const status = await service.get2FAStatus(user.id);

      expect(status.enabled).toBe(true);
      expect(status.hasSecret).toBe(true);
    });
  });

  // ─── validateUser ─────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('returns a user for a valid email', async () => {
      const user = makeUser();
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.validateUser('test@example.com');
      expect(result).toBe(user);
    });

    it('throws UnauthorizedException for unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.validateUser('unknown@example.com')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── Recovery codes ───────────────────────────────────────────────────

  describe('generateRecoveryCodes', () => {
    it('generates 8 recovery codes for the user', async () => {
      const user = makeUser();
      usersService.findOneById.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);

      const result = await service.generateRecoveryCodes(user.id);

      expect(result.codes).toHaveLength(8);
      result.codes.forEach((code: string) => {
        expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
      });
      expect(user.recoveryCodeHashes).toHaveLength(8);
    });
  });

  // ─── Login sessions ──────────────────────────────────────────────────

  describe('login sessions', () => {
    it('getLoginSessions returns sessions with status flags', async () => {
      const session = { id: 's1', isCurrent: false, isRevoked: false, isApproved: true } as any;
      loginSessionRepo.find.mockResolvedValue([{ id: 's1' } as LoginSession]);

      const result = await service.getLoginSessions('user-1', 's2');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('isCurrent', false);
      expect(result[0]).toHaveProperty('isRevoked', false);
    });

    it('getPendingLoginSessions only returns unapproved sessions', async () => {
      const session = { id: 's1', revokedAt: null, approvedAt: null } as LoginSession;
      loginSessionRepo.find.mockResolvedValue([session]);

      const result = await service.getPendingLoginSessions('user-1');

      expect(result).toHaveLength(1);
    });

    it('approveLoginSession sets approvedAt', async () => {
      const session = { id: 's1', approvedAt: null } as any;
      loginSessionRepo.findOne.mockResolvedValue(session);
      loginSessionRepo.save.mockResolvedValue(session);

      const result = await service.approveLoginSession('user-1', 's1');

      expect(result.message).toBe('Session approved.');
      expect(session.approvedAt).toBeInstanceOf(Date);
    });

    it('revokeLoginSession sets revokedAt', async () => {
      const session = { id: 's1', revokedAt: null } as any;
      loginSessionRepo.findOne.mockResolvedValue(session);
      loginSessionRepo.save.mockResolvedValue(session);

      const result = await service.revokeLoginSession('user-1', 's1');

      expect(result.message).toBe('Session revoked.');
      expect(session.revokedAt).toBeInstanceOf(Date);
    });

    it('revokeAllOtherSessions revokes all sessions except the current one', async () => {
      const sessions = [
        { id: 's1', revokedAt: null } as LoginSession,
        { id: 's2', revokedAt: null } as LoginSession,
        { id: 's3', revokedAt: null } as LoginSession,
      ];
      loginSessionRepo.find.mockResolvedValue(sessions);
      loginSessionRepo.save.mockResolvedValue(sessions[0] as LoginSession);

      const result = await service.revokeAllOtherSessions('user-1', 's2');

      expect(result.message).toBe('Other sessions revoked.');
      // s1 and s3 should be revoked, s2 (current) should not
      expect(sessions[0].revokedAt).toBeInstanceOf(Date);
      expect(sessions[1].revokedAt).toBeNull();
      expect(sessions[2].revokedAt).toBeInstanceOf(Date);
    });

    it('revokeAllOtherSessions does nothing when only one session exists', async () => {
      const sessions = [{ id: 's1', revokedAt: null } as LoginSession];
      loginSessionRepo.find.mockResolvedValue(sessions);

      const result = await service.revokeAllOtherSessions('user-1', 's1');

      expect(result.message).toBe('Other sessions revoked.');
      expect(sessions[0].revokedAt).toBeNull();
    });

    it('revokeAllOtherSessions does not revoke already revoked sessions', async () => {
      const sessions = [
        { id: 's1', revokedAt: new Date() } as LoginSession,
        { id: 's2', revokedAt: null } as LoginSession,
      ];
      loginSessionRepo.find.mockResolvedValue(sessions);

      await service.revokeAllOtherSessions('user-1', 's2');

      // s1 is already revoked, s2 is the current session — save is never called
      expect(loginSessionRepo.save).not.toHaveBeenCalled();
      expect(sessions[0].revokedAt).toBeInstanceOf(Date);
      expect(sessions[1].revokedAt).toBeNull();
    });
  });

  // ─── signOut ───────────────────────────────────────────────────────────

  describe('signOut', () => {
    it('revokes the session when a valid sessionId is provided', async () => {
      const session = { id: 's1', revokedAt: null } as any;
      loginSessionRepo.findOne.mockResolvedValue(session);
      loginSessionRepo.save.mockResolvedValue(session);

      const result = await service.signOut('s1');

      expect(result.message).toBe('Signed out successfully.');
      expect(session.revokedAt).toBeInstanceOf(Date);
    });

    it('does nothing when sessionId is undefined', async () => {
      const result = await service.signOut(undefined);

      expect(result.message).toBe('Signed out successfully.');
      expect(loginSessionRepo.findOne).not.toHaveBeenCalled();
      expect(loginSessionRepo.save).not.toHaveBeenCalled();
    });

    it('does nothing when session is not found', async () => {
      loginSessionRepo.findOne.mockResolvedValue(null);

      const result = await service.signOut('non-existent');

      expect(result.message).toBe('Signed out successfully.');
      expect(loginSessionRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── refreshToken ─────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('issues a new token when session is valid', async () => {
      const session = { id: 's1', revokedAt: null } as LoginSession;
      const user = makeUser();
      loginSessionRepo.findOne.mockResolvedValue(session);
      loginSessionRepo.update.mockResolvedValue(undefined);
      usersService.findOneById.mockResolvedValue(user);

      const result = await service.refreshToken(user.id, 's1');

      expect(result.access_token).toBe('jwt-token');
      expect(loginSessionRepo.update).toHaveBeenCalledWith('s1', { lastSeenAt: expect.any(Date) });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: user.id, email: user.email, sid: 's1' },
        expect.anything(),
      );
    });

    it('throws BadRequestException when sessionId is undefined', async () => {
      await expect(service.refreshToken('user-1')).rejects.toThrow('No active session to refresh.');
    });

    it('throws UnauthorizedException when session is revoked', async () => {
      loginSessionRepo.findOne.mockResolvedValue({ id: 's1', revokedAt: new Date() } as LoginSession);

      await expect(service.refreshToken('user-1', 's1')).rejects.toThrow('Session is invalid or has been revoked.');
    });

    it('throws UnauthorizedException when session does not exist', async () => {
      loginSessionRepo.findOne.mockResolvedValue(null);

      await expect(service.refreshToken('user-1', 'non-existent')).rejects.toThrow('Session is invalid or has been revoked.');
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      loginSessionRepo.findOne.mockResolvedValue({ id: 's1', revokedAt: null } as LoginSession);
      usersService.findOneById.mockResolvedValue(null);

      await expect(service.refreshToken('non-existent', 's1')).rejects.toThrow('User not found.');
    });
  });

  // ─── Trusted recovery contacts ────────────────────────────────────────

  describe('trusted recovery contacts', () => {
    it('getTrustedRecoveryContacts returns the contact list', async () => {
      const user = makeUser({ trustedRecoveryContacts: ['friend@example.com'] });
      usersService.findOneById.mockResolvedValue(user);

      const result = await service.getTrustedRecoveryContacts(user.id);

      expect(result.contacts).toEqual(['friend@example.com']);
    });

    it('setTrustedRecoveryContacts normalized and deduplicates', async () => {
      const user = makeUser();
      usersService.findOneById.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);

      const result = await service.setTrustedRecoveryContacts(user.id, ['  Friend@Example.COM ']);

      expect(result.contacts).toEqual(['friend@example.com']);
      expect(user.trustedRecoveryContacts).toEqual(['friend@example.com']);
    });

    it('requestTrustedContactRecovery sends code and saves hash', async () => {
      const user = makeUser({ trustedRecoveryContacts: ['contact@example.com'] });
      usersService.findByEmail.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);

      const result = await service.requestTrustedContactRecovery('test@example.com', 'contact@example.com');

      expect(result.message).toContain('recovery challenge');
      expect(user.trustedRecoveryCodeHash).toBeDefined();
      expect(user.trustedRecoveryCodeExpiresAt).toBeInstanceOf(Date);
      expect(emailService.sendTrustedRecoveryCodeEmail).toHaveBeenCalledWith('contact@example.com', expect.any(String));
    });

    it('requestTrustedContactRecovery returns generic message when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.requestTrustedContactRecovery('unknown@example.com', 'contact@example.com');

      expect(result.message).toContain('recovery challenge');
      expect(emailService.sendTrustedRecoveryCodeEmail).not.toHaveBeenCalled();
    });

    it('requestTrustedContactRecovery returns generic message when contact not trusted', async () => {
      const user = makeUser({ trustedRecoveryContacts: ['other@example.com'] });
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.requestTrustedContactRecovery('test@example.com', 'not-trusted@example.com');

      expect(result.message).toContain('recovery challenge');
      expect(usersService.save).not.toHaveBeenCalled();
    });

    it('verifyTrustedContactRecovery issues token on valid code', async () => {
      const mockSession = { id: 'session-1', revokedAt: null, deviceName: 'test', ipAddress: '127.0.0.1', suspicious: false } as any;
      loginSessionRepo.create.mockReturnValue(mockSession);
      loginSessionRepo.save.mockResolvedValue(mockSession);
      loginSessionRepo.findOne.mockResolvedValue(null); // for isSuspiciousSession

      // The mocked createHash returns 'aabbccdd11223344' for any input
      const user = makeUser({
        trustedRecoveryContacts: ['contact@example.com'],
        trustedRecoveryCodeHash: 'aabbccdd11223344',
        trustedRecoveryCodeExpiresAt: new Date(Date.now() + 600_000),
      });
      usersService.findByEmail.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);

      const result = await service.verifyTrustedContactRecovery('test@example.com', 'contact@example.com', 'ANY-CODE');

      expect(result.access_token).toBe('jwt-token');
      expect(user.trustedRecoveryCodeHash).toBeNull();
      expect(user.trustedRecoveryCodeExpiresAt).toBeNull();
    });

    it('verifyTrustedContactRecovery throws when code expired', async () => {
      const user = makeUser({
        trustedRecoveryContacts: ['contact@example.com'],
        trustedRecoveryCodeHash: '$2b$10$hashedcode',
        trustedRecoveryCodeExpiresAt: new Date(Date.now() - 1000), // expired
      });
      usersService.findByEmail.mockResolvedValue(user);

      await expect(
        service.verifyTrustedContactRecovery('test@example.com', 'contact@example.com', 'WRONG'),
      ).rejects.toThrow('Recovery challenge expired.');
    });

    it('verifyTrustedContactRecovery throws when contact not trusted', async () => {
      const user = makeUser({
        trustedRecoveryContacts: ['other@example.com'],
        trustedRecoveryCodeHash: '$2b$10$hashedcode',
        trustedRecoveryCodeExpiresAt: new Date(Date.now() + 600_000),
      });
      usersService.findByEmail.mockResolvedValue(user);

      await expect(
        service.verifyTrustedContactRecovery('test@example.com', 'not-trusted@example.com', 'CODE'),
      ).rejects.toThrow('Invalid recovery credentials.');
    });
  });

  // ─── recoverAccount ───────────────────────────────────────────────────

  describe('recoverAccount', () => {
    const mockSession = { id: 'session-1', revokedAt: null, deviceName: 'test', ipAddress: '127.0.0.1', suspicious: false } as any;

    beforeEach(() => {
      loginSessionRepo.create.mockReturnValue(mockSession);
      loginSessionRepo.save.mockResolvedValue(mockSession);
      loginSessionRepo.findOne.mockResolvedValue(null); // for isSuspiciousSession
    });

    it('issues token on valid recovery code', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(true);

      const user = makeUser({ recoveryCodeHashes: ['$2b$10$hash1', '$2b$10$hash2'] });
      usersService.findByEmail.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);

      const result = await service.recoverAccount('test@example.com', 'RECOVERY');

      expect(result.access_token).toBe('jwt-token');
      // Code should be removed from the list
      expect(user.recoveryCodeHashes).toHaveLength(1);
    });

    it('throws on invalid recovery code', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      const user = makeUser({ recoveryCodeHashes: ['$2b$10$hash1'] });
      usersService.findByEmail.mockResolvedValue(user);

      await expect(service.recoverAccount('test@example.com', 'WRONG')).rejects.toThrow('Invalid recovery credentials.');
    });

    it('throws when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.recoverAccount('unknown@example.com', 'CODE')).rejects.toThrow('Invalid recovery credentials.');
    });

    it('throws when user has no recovery codes', async () => {
      const user = makeUser({ recoveryCodeHashes: [] });
      usersService.findByEmail.mockResolvedValue(user);

      await expect(service.recoverAccount('test@example.com', 'CODE')).rejects.toThrow('Invalid recovery credentials.');
    });

    it('works with username identifier', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(true);

      const user = makeUser({ recoveryCodeHashes: ['$2b$10$hash1'] });
      usersService.findByUsername.mockResolvedValue(user);
      usersService.save.mockResolvedValue(user);

      const result = await service.recoverAccount('testuser', 'RECOVERY');

      expect(result.access_token).toBe('jwt-token');
      expect(usersService.findByUsername).toHaveBeenCalledWith('testuser');
    });
  });

  // ─── getRecoveryOptions ───────────────────────────────────────────────

  describe('getRecoveryOptions', () => {
    it('returns available recovery methods', async () => {
      const user = makeUser({
        trustedRecoveryContacts: ['friend@example.com'],
        recoveryCodeHashes: ['$2b$10$hash1'],
      });
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.getRecoveryOptions('test@example.com');

      expect(result.methods.passwordReset).toBe(true);
      expect(result.methods.recoveryCodes).toBe(true);
      expect(result.methods.trustedContacts).toEqual(['fr***@example.com']);
    });

    it('returns masked email for trusted contacts', async () => {
      const user = makeUser({ trustedRecoveryContacts: ['a@b.com'] });
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.getRecoveryOptions('test@example.com');

      expect(result.methods.trustedContacts).toEqual(['a***@b.com']);
    });

    it('returns empty when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.getRecoveryOptions('unknown@example.com');

      expect(result.methods.passwordReset).toBe(false);
      expect(result.methods.recoveryCodes).toBe(false);
      expect(result.methods.trustedContacts).toEqual([]);
    });
  });

  // ─── Magic link ─────────────────────────────────────────────────────────

  describe('magic link', () => {
    it('stores a hashed one-time token and emails a sign-in link for an existing user', async () => {
      const user = makeUser({ email: 'test@example.com', emailVerified: true });
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.requestMagicLink('test@example.com');

      expect(result.message).toContain('sign-in link');
      expect(usersService.save).toHaveBeenCalledWith(
        expect.objectContaining({ magicLinkTokenHash: 'aabbccdd11223344' }),
      );
      expect(emailService.sendMagicLinkEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining('/verify-link?token='),
      );
    });

    it('does not reveal whether an account exists for an unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.requestMagicLink('nobody@example.com');

      expect(result.message).toContain('sign-in link');
      expect(usersService.save).not.toHaveBeenCalled();
      expect(emailService.sendMagicLinkEmail).not.toHaveBeenCalled();
    });

    it('verifies a valid magic link, marks the email verified, and issues a token', async () => {
      const user = makeUser({
        email: 'test@example.com',
        emailVerified: false,
        magicLinkTokenHash: 'aabbccdd11223344',
        magicLinkTokenExpiresAt: new Date(Date.now() + 15 * 60_000),
      });
      usersService.findByMagicLinkTokenHash.mockResolvedValue(user);
      loginSessionRepo.create.mockReturnValue({ id: 'session-ml' } as any);
      loginSessionRepo.save.mockResolvedValue({ id: 'session-ml' } as any);
      jwtService.sign.mockReturnValue('magic-jwt-token');

      const result = await service.verifyMagicLink('the-raw-token', {
        headers: { 'user-agent': 'test' },
      } as any);

      expect(usersService.findByMagicLinkTokenHash).toHaveBeenCalledWith('aabbccdd11223344');
      expect(usersService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: true,
          magicLinkTokenHash: null,
          magicLinkTokenExpiresAt: null,
        }),
      );
      expect(result.access_token).toBe('magic-jwt-token');
    });

    it('rejects an invalid or expired magic link', async () => {
      usersService.findByMagicLinkTokenHash.mockResolvedValue(undefined);

      await expect(service.verifyMagicLink('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
