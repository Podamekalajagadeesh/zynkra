import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { createHash, createHmac, randomBytes, randomInt } from 'crypto';
import type { StringValue } from 'ms';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { LoginSession } from './entities/login-session.entity';
import { CaptchaService } from './captcha.service';
import { InviteCodesService } from '../invite-codes/invite-codes.service';
import { BrainwaveDevice } from './entities/brainwave-device.entity';
import { AccountManagementService } from '../features/account-management/account-management.service';
import { LoginApprovalService } from '../features/account-management/login-approval.service';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import {
  SecurityEventType,
  SecurityEventSeverity,
} from '../security-audit/entities/security-audit.entity';
import { ipInAllowlist } from '../common/ip';

class LoginApprovalRequiredException extends UnauthorizedException {
  readonly sessionId: string;

  constructor(
    sessionId: string,
    message = 'This login requires approval before access is granted.'
  ) {
    super(message);
    this.sessionId = sessionId;
    this.name = 'LoginApprovalRequiredException';
  }
}

type AuthTokenResponse = {
  access_token: string;
  refresh_token: string;
};

/**
 * Strips the IPv4-mapped IPv6 prefix Node reports for IPv4 clients
 * (`::ffff:127.0.0.1` -> `127.0.0.1`) so the same client does not look like a
 * new address on every request.
 */
function normalizeIp(ip: string): string {
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(LoginSession)
    private readonly loginSessionsRepository: Repository<LoginSession>,
    private readonly captchaService: CaptchaService,
    private readonly inviteCodesService: InviteCodesService,
    @InjectRepository(BrainwaveDevice)
    private readonly brainwaveDevicesRepository: Repository<BrainwaveDevice>,
    private readonly accountManagementService?: AccountManagementService,
    private readonly securityAuditService?: SecurityAuditService,
    private readonly loginApprovalService?: LoginApprovalService
  ) {}

  private get clientUrl(): string {
    return this.configService.get<string>('CLIENT_URL') || 'http://localhost:5173';
  }

  private generateBase32Secret(length = 20): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes = randomBytes(length);
    let secret = '';
    for (const byte of bytes) {
      secret += alphabet[byte % alphabet.length];
    }
    return secret;
  }

  private base32ToBuffer(secret: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = secret.replace(/=+$/g, '').toUpperCase();
    let bits = '';
    for (const char of cleaned) {
      const value = alphabet.indexOf(char);
      if (value < 0) {
        throw new BadRequestException('Invalid 2FA secret.');
      }
      bits += value.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let index = 0; index + 8 <= bits.length; index += 8) {
      bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
    }

    return Buffer.from(bytes);
  }

  private generateTotp(secret: string, counter: number): string {
    const key = this.base32ToBuffer(secret);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));
    const hmac = createHmac('sha1', key).update(counterBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    return (binary % 1_000_000).toString().padStart(6, '0');
  }

  private verifyTotp(secret: string, token: string): boolean {
    const normalizedToken = token.replace(/\s+/g, '');
    const currentCounter = Math.floor(Date.now() / 30_000);
    for (const offset of [-1, 0, 1]) {
      if (this.generateTotp(secret, currentCounter + offset) === normalizedToken) {
        return true;
      }
    }
    return false;
  }

  private buildOtpAuthUrl(user: User, secret: string): string {
    const label = encodeURIComponent(`Zynkra:${user.email || user.username || user.id}`);
    const issuer = encodeURIComponent('Zynkra');
    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  }

  private getRequestDeviceName(req?: any): string | null {
    const userAgent = req?.headers?.['user-agent'];
    if (!userAgent || typeof userAgent !== 'string') {
      return null;
    }

    return userAgent.length > 120 ? `${userAgent.slice(0, 117)}...` : userAgent;
  }

  private getRequestIp(req?: any): string | null {
    // Use the Express-resolved address, not the raw header. `req.ip` only
    // honours `x-forwarded-for` when `trust proxy` is configured (see
    // TRUST_PROXY in main.ts), so it cannot be spoofed by a client that sets
    // the header itself. Reading the header directly let anyone forge their IP,
    // which defeated new-device detection and poisoned the security audit log.
    if (typeof req?.ip === 'string' && req.ip.length > 0) {
      return normalizeIp(req.ip);
    }

    const remote = req?.socket?.remoteAddress;
    if (typeof remote === 'string' && remote.length > 0) {
      return normalizeIp(remote);
    }

    return null;
  }

  private async createLoginSession(
    user: User,
    req?: any,
    isTrusted = false
  ): Promise<LoginSession> {
    // Resolve trust from the persisted allowlist unless the caller already
    // decided. `isTrusted` was previously never passed as true, so
    // `LoginSession.isTrusted` was always false and the trusted-IP control did
    // nothing.
    const trusted = isTrusted || (await this.isTrustedIp(user, req));
    const suspicious = trusted ? false : await this.isSuspiciousSession(user.id, req);
    const session = this.loginSessionsRepository.create({
      user,
      deviceName: this.getRequestDeviceName(req),
      userAgent:
        typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : null,
      ipAddress: this.getRequestIp(req),
      lastSeenAt: new Date(),
      revokedAt: null,
      approvedAt: suspicious ? null : new Date(),
      suspicious,
      isTrusted: trusted,
    });

    return this.loginSessionsRepository.save(session);
  }

  /**
   * True when the request's IP is covered by the user's trusted list.
   *
   * Entries may be exact addresses or CIDR ranges (`203.0.113.0/24`,
   * `2001:db8::/32`). Hostnames are deliberately not resolved — a trusted entry
   * must be a literal address, otherwise an attacker-controlled DNS record could
   * widen the allowlist.
   */
  private async isTrustedIp(user: User, req?: any): Promise<boolean> {
    const trusted = user?.trustedIpAddresses;
    if (!Array.isArray(trusted) || trusted.length === 0) {
      return false;
    }
    return ipInAllowlist(this.getRequestIp(req), trusted);
  }

  private async isSuspiciousSession(userId: string, req?: any): Promise<boolean> {
    const currentIp = this.getRequestIp(req);
    const currentDevice = this.getRequestDeviceName(req);

    const latestSession = await this.loginSessionsRepository.findOne({
      where: { user: { id: userId }, revokedAt: null },
      order: { createdAt: 'DESC' },
    });

    if (!latestSession) {
      return false;
    }

    if (currentIp && latestSession.ipAddress && currentIp !== latestSession.ipAddress) {
      return true;
    }

    if (currentDevice && latestSession.deviceName && currentDevice !== latestSession.deviceName) {
      return true;
    }

    return false;
  }

  private async notifyLoginAlert(user: User, session: LoginSession): Promise<void> {
    await this.notificationsService.createNotification(user, NotificationType.LOGIN_ALERT, {
      sessionId: session.id,
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      suspicious: session.suspicious,
    });

    if (user.email) {
      try {
        await this.emailService.sendLoginAlertEmail(user.email, {
          deviceName: session.deviceName,
          ipAddress: session.ipAddress,
          suspicious: session.suspicious,
        });
      } catch (err) {
        // A login-alert email must never fail the login itself.
        this.logger.warn(`Failed to send login alert email to ${user.email}`);
      }
    }
  }

  private async handleSuspiciousLogin(user: User, session: LoginSession, req?: any): Promise<void> {
    if (!session.suspicious) {
      return;
    }

    try {
      if (this.loginApprovalService) {
        await this.loginApprovalService.createLoginApprovalRequest(
          user.id,
          session.deviceName ?? 'Unknown device',
          session.ipAddress ?? this.getRequestIp(req) ?? undefined,
          session.userAgent ??
            (typeof req?.headers?.['user-agent'] === 'string'
              ? req.headers['user-agent']
              : undefined),
          undefined
        );
      }

      if (this.accountManagementService) {
        await this.accountManagementService.recordSecurityAlert(
          user.id,
          'suspicious_login',
          `Suspicious login detected on ${session.deviceName ?? 'an unrecognized device'}.`,
          'high',
          {
            sessionId: session.id,
            ipAddress: session.ipAddress ?? this.getRequestIp(req),
            userAgent:
              session.userAgent ??
              (typeof req?.headers?.['user-agent'] === 'string'
                ? req.headers['user-agent']
                : undefined),
            deviceName: session.deviceName,
            suspicious: true,
          }
        );

        await this.accountManagementService.createLoginApproval(user.id, {
          deviceName: session.deviceName ?? 'Unknown device',
          ipAddress: session.ipAddress ?? this.getRequestIp(req) ?? undefined,
          userAgent:
            session.userAgent ??
            (typeof req?.headers?.['user-agent'] === 'string'
              ? req.headers['user-agent']
              : undefined),
          location: undefined,
        });
      }
    } catch (error) {
      this.logger.warn(
        `Security alert flow failed for suspicious login for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private hashRecoveryCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      return email;
    }

    const visible = localPart.length <= 2 ? localPart[0] : localPart.slice(0, 2);
    return `${visible}***@${domain}`;
  }

  private getTokenExpiry(rememberMe: boolean): StringValue {
    return this.configService.get<string>(
      rememberMe ? 'JWT_REMEMBER_ME_EXPIRES' : 'JWT_EXPIRES_IN',
      rememberMe ? '30d' : '60m'
    ) as StringValue;
  }

  private getTokenAudience(): string {
    return this.configService.get<string>('JWT_AUDIENCE', 'zynkra-api');
  }

  private getTwoFactorSecret(): string {
    return this.configService.get<string>(
      'JWT_2FA_SECRET',
      createHash('sha256')
        .update(`${this.configService.get<string>('JWT_SECRET')}:two-factor`)
        .digest('hex')
    );
  }

  private createTokenResponse(
    user: User,
    session: LoginSession,
    rememberMe: boolean
  ): AuthTokenResponse {
    const audience = this.getTokenAudience();
    return {
      access_token: this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          sid: session.id,
          typ: 'access',
          aud: audience,
        },
        { expiresIn: this.getTokenExpiry(rememberMe) }
      ),
      refresh_token: this.jwtService.sign(
        {
          sub: user.id,
          sid: session.id,
          typ: 'refresh',
          aud: audience,
        },
        { expiresIn: rememberMe ? '30d' : '7d' }
      ),
    };
  }

  private async recordSecurityEvent(
    userId: string,
    eventType: SecurityEventType,
    severity: SecurityEventSeverity,
    message: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    if (!this.securityAuditService) {
      return;
    }

    try {
      await this.securityAuditService.logEvent({
        userId,
        eventType,
        severity,
        message,
        metadata,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to persist security audit log for ${userId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async issueAccessToken(
    user: User,
    req?: any,
    rememberMe = false
  ): Promise<AuthTokenResponse> {
    const session = await this.createLoginSession(user, req);
    await this.notifyLoginAlert(user, session);
    await this.handleSuspiciousLogin(user, session, req);

    if (session.suspicious) {
      await this.recordSecurityEvent(
        user.id,
        SecurityEventType.LOGIN_FAILED,
        SecurityEventSeverity.HIGH,
        `Login approval required for ${user.email ?? user.username ?? user.id} from ${this.getRequestIp(req) ?? 'an unknown IP'}.`,
        {
          sessionId: session.id,
          rememberMe,
          suspicious: true,
          approvalRequired: true,
        },
        this.getRequestIp(req) ?? undefined,
        typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined
      );

      throw new LoginApprovalRequiredException(session.id);
    }

    await this.recordSecurityEvent(
      user.id,
      SecurityEventType.LOGIN_SUCCESS,
      SecurityEventSeverity.LOW,
      `User ${user.email ?? user.username ?? user.id} signed in successfully from ${this.getRequestIp(req) ?? 'an unknown IP'}.`,
      {
        sessionId: session.id,
        rememberMe,
        suspicious: session.suspicious,
      },
      this.getRequestIp(req) ?? undefined,
      typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined
    );

    return this.createTokenResponse(user, session, rememberMe);
  }

  async login(user: User, req?: any, rememberMe = false): Promise<AuthTokenResponse> {
    return this.issueAccessToken(user, req, rememberMe);
  }

  /**
   * Anti-bot gate on signin.
   *
   * The CAPTCHA is an `a + b` puzzle whose expression is returned to the client,
   * so it is solvable by any script. It is a speed bump, not proof of a human —
   * the code and docs say so. What makes it worth having is *when* it is
   * demanded:
   *
   *  - Always, when `CAPTCHA_REQUIRED_ON_SIGNIN=true`.
   *  - Always, when a client supplies a challenge (so a well-behaved client can
   *    opt in and have it validated).
   *  - Automatically, once this identifier has accumulated
   *    `CAPTCHA_FAILURE_THRESHOLD` recent failed sign-ins — i.e. it escalates
   *    exactly when credential stuffing is being attempted, instead of taxing
   *    every legitimate user.
   *
   * The counter is derived from `security_audit_logs`, so it is shared across
   * instances and survives restarts rather than living in memory.
   */
  private async enforceSigninCaptcha(
    identifier: string,
    captchaId?: string,
    captchaAnswer?: string
  ): Promise<void> {
    const requiredByConfig =
      this.configService.get<string>('CAPTCHA_REQUIRED_ON_SIGNIN', 'false') === 'true';
    const alwaysWhenSupplied = Boolean(captchaId);
    const challengedByRisk = await this.recentFailuresForIdentifier(identifier);

    if (!requiredByConfig && !alwaysWhenSupplied && !challengedByRisk) {
      return;
    }

    if (!(await this.captchaService.verify(captchaId, captchaAnswer))) {
      throw new BadRequestException('CAPTCHA failed or expired. Please try again.');
    }
  }

  /**
   * Count recent failed sign-ins for an email/username, reading the persisted
   * audit log rather than an in-process counter.
   */
  private async recentFailuresForIdentifier(identifier: string): Promise<boolean> {
    if (!this.securityAuditService) {
      return false;
    }
    const threshold = this.configService.get<number>('CAPTCHA_FAILURE_THRESHOLD', 3);
    if (threshold <= 0) {
      return false;
    }

    const windowMs = this.configService.get<number>('CAPTCHA_FAILURE_WINDOW_MINUTES', 15) * 60_000;
    const since = new Date(Date.now() - windowMs);

    try {
      const { total } = await this.securityAuditService.getUserAuditLog(
        // The audit log is keyed by user id, so this only works once the
        // identifier resolves to a user; an unknown identifier is left to the
        // per-IP throttle, which is the right place for it anyway.
        await this.resolveAuditUserId(identifier),
        { eventType: SecurityEventType.LOGIN_FAILED, fromDate: since, take: threshold }
      );
      return total >= threshold;
    } catch (error) {
      this.logger.warn(
        `Failed to read recent sign-in failures: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  private async resolveAuditUserId(identifier: string): Promise<string> {
    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);
    return user?.id ?? '00000000-0000-0000-0000-000000000000';
  }

  async guestSignIn(req?: any): Promise<{ access_token: string }> {
    const user = await this.usersService.createGuestUser();
    return this.issueAccessToken(user, req);
  }

  async anonymousSignIn(req?: any): Promise<{ access_token: string }> {
    const user = await this.usersService.createAnonymousUser();
    return this.issueAccessToken(user, req);
  }

  async requestMagicLink(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.email) {
      return { message: 'If an account exists for that email, a sign-in link has been sent.' };
    }

    const token = randomBytes(32).toString('hex');
    const ttlMinutes = this.configService.get<number>('MAGIC_LINK_TTL_MINUTES', 15);
    user.magicLinkTokenHash = createHash('sha256').update(token).digest('hex');
    user.magicLinkTokenExpiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    await this.usersService.save(user);

    const link = `${this.clientUrl}/verify-link?token=${token}`;
    try {
      await this.emailService.sendMagicLinkEmail(user.email, link);
    } catch (err) {
      this.logger.warn(`Failed to send magic link email to ${user.email}`);
    }

    return { message: 'If an account exists for that email, a sign-in link has been sent.' };
  }

  async verifyMagicLink(token: string, req?: any): Promise<{ access_token: string }> {
    const hash = createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByMagicLinkTokenHash(hash);
    if (
      !user ||
      !user.magicLinkTokenExpiresAt ||
      user.magicLinkTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('This sign-in link is invalid or has expired.');
    }

    user.magicLinkTokenHash = null;
    user.magicLinkTokenExpiresAt = null;
    user.emailVerified = true;
    await this.usersService.save(user);

    return this.issueAccessToken(user, req);
  }

  async signUp(signUpDto: SignUpDto): Promise<{ message: string }> {
    const { username, email, password, birthDate, captchaId, captchaAnswer, inviteCode } =
      signUpDto;

    if (!(await this.captchaService.verify(captchaId, captchaAnswer))) {
      throw new BadRequestException('CAPTCHA failed or expired. Please try again.');
    }

    const minimumAge = this.configService.get<number>('MINIMUM_AGE', 13);
    const age = this.computeAge(birthDate);
    if (age === null || age < minimumAge) {
      throw new BadRequestException(`You must be at least ${minimumAge} years old to register.`);
    }

    const inviteRequired =
      this.configService.get<string>('INVITE_CODE_REQUIRED', 'false') === 'true';
    if (inviteRequired && !inviteCode) {
      throw new BadRequestException('An invite code is required to register.');
    }
    let consumeInvite = false;
    if (inviteCode) {
      consumeInvite = this.inviteCodesService.isUsable(
        await this.inviteCodesService.findByCode(inviteCode)
      );
      if (!consumeInvite) {
        throw new BadRequestException('Invalid or expired invite code.');
      }
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    if (username) {
      const existingUsername = await this.usersService.findByUsername(username);
      if (existingUsername) {
        throw new ConflictException('Username already in use');
      }
    }

    const password_hash = await bcrypt.hash(password, 10);
    // randomInt, not Math.random(): this is a 6-digit email verification code
    // with a 1-hour lifetime and no attempt limit, so a predictable generator
    // makes account takeover a matter of luck rather than work.
    const emailVerificationCode = randomInt(100000, 1000000).toString();
    const emailVerificationToken = emailVerificationCode;
    const emailVerificationTokenExpires = new Date();
    emailVerificationTokenExpires.setHours(emailVerificationTokenExpires.getHours() + 1); // Token expires in 1 hour

    const user = await this.usersService.createUser({
      username,
      email,
      password_hash,
      birthDate,
      birthDateVerifiedAt: new Date(),
      emailVerificationToken,
      emailVerificationTokenExpires,
    });

    if (consumeInvite) {
      await this.inviteCodesService.consume(inviteCode!);
    }

    try {
      await this.emailService.sendVerificationCode(user.email, emailVerificationCode);
    } catch (err) {
      // The account is created and the code is stored — a provider rejection
      // (e.g. unverified sender) must not fail the signup itself.
      this.logger.warn(`Failed to send verification code to ${user.email}`);
    }

    await this.recordSecurityEvent(
      user.id,
      SecurityEventType.LOGIN_SUCCESS,
      SecurityEventSeverity.LOW,
      `User ${user.email} created a new account and initiated email verification.`,
      { username: user.username, method: 'email_signup' }
    );

    return {
      message: 'Signup successful. A 6-digit verification code has been sent to your email.',
    };
  }

  private computeAge(birthDate: string): number | null {
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const hasHadBirthday =
      today.getMonth() > birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    if (!hasHadBirthday) age -= 1;
    return age;
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    // Don't reveal whether the user exists; return same message in all cases.
    if (!user || user.emailVerified) {
      return { message: 'If a user with that email exists, a verification email has been sent.' };
    }

    // randomInt, not Math.random() — see the note in signUp.
    const emailVerificationCode = randomInt(100000, 1000000).toString();
    const emailVerificationTokenExpires = new Date();
    emailVerificationTokenExpires.setHours(emailVerificationTokenExpires.getHours() + 1);

    user.emailVerificationToken = emailVerificationCode;
    user.emailVerificationTokenExpires = emailVerificationTokenExpires;
    // Issuing a fresh code clears any lockout — otherwise a user who exhausted
    // their attempts could never recover, since a lockout blocks redemption of
    // the very code we just emailed them.
    user.emailVerificationAttempts = 0;
    user.emailVerificationLockedUntil = null;
    await this.usersService.save(user);

    await this.emailService.sendVerificationCode(user.email, emailVerificationCode);

    return { message: 'If a user with that email exists, a verification code has been sent.' };
  }

  async verifyEmail(token: string, req?: any): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmailVerificationToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (user.emailVerificationTokenExpires < new Date()) {
      throw new UnauthorizedException('Verification token has expired');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    await this.usersService.save(user);

    await this.recordSecurityEvent(
      user.id,
      SecurityEventType.EMAIL_VERIFIED,
      SecurityEventSeverity.LOW,
      `User ${user.email} verified their email address.`,
      { verificationMethod: 'token' },
      this.getRequestIp(req) ?? undefined,
      typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined
    );

    return this.issueAccessToken(user, req);
  }

  /**
   * Redeem a 6-digit email verification code.
   *
   * Failures are counted per account and, past
   * `VERIFICATION_CODE_MAX_ATTEMPTS`, redemption is blocked for a cooling-off
   * period that grows with each additional breach. The per-IP throttle on this
   * route was the only other barrier, which a patient attacker with a few IPs
   * could work around. Success resets the counter.
   */
  async verifyByCode(email: string, code: string, req?: any): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or code');
    }

    if (user.emailVerified) {
      throw new UnauthorizedException('Invalid email or code');
    }

    this.assertNotVerificationLocked(user);

    const maxAttempts = this.configService.get<number>('VERIFICATION_CODE_MAX_ATTEMPTS', 5);
    const lockoutMs = this.configService.get<number>('VERIFICATION_CODE_LOCKOUT_MINUTES', 15);

    if (user.emailVerificationToken !== code) {
      user.emailVerificationAttempts = (user.emailVerificationAttempts ?? 0) + 1;
      user.emailVerificationLockedUntil =
        user.emailVerificationAttempts >= maxAttempts
          ? new Date(Date.now() + lockoutMs * 60_000)
          : null;
      await this.usersRepository.save(user);

      await this.recordSecurityEvent(
        user.id,
        SecurityEventType.LOGIN_FAILED,
        SecurityEventSeverity.MEDIUM,
        `Failed email verification code attempt for ${user.email ?? user.username ?? user.id} ` +
          `(${user.emailVerificationAttempts}/${maxAttempts}).`,
        { reason: 'invalid_verification_code', attempts: user.emailVerificationAttempts },
        this.getRequestIp(req) ?? undefined,
        typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined
      );

      if (user.emailVerificationAttempts >= maxAttempts) {
        throw new UnauthorizedException(
          `Too many incorrect codes. Try again in ${lockoutMs} minutes or request a new one.`
        );
      }

      throw new UnauthorizedException('Invalid verification code');
    }

    if (user.emailVerificationTokenExpires < new Date()) {
      throw new UnauthorizedException('Verification code has expired');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    user.emailVerificationAttempts = 0;
    user.emailVerificationLockedUntil = null;
    await this.usersRepository.save(user);

    return this.issueAccessToken(user, req);
  }

  private assertNotVerificationLocked(user: User): void {
    if (!user.emailVerificationLockedUntil) {
      return;
    }
    if (user.emailVerificationLockedUntil > new Date()) {
      const minutes = Math.max(
        1,
        Math.ceil((user.emailVerificationLockedUntil.getTime() - Date.now()) / 60_000)
      );
      throw new UnauthorizedException(
        `Too many incorrect codes. Try again in ${minutes} minute(s) or request a new one.`
      );
    }
    // Lockout has elapsed — let them try again, but keep the escalated counter.
    user.emailVerificationLockedUntil = null;
  }

  async signIn(
    signInDto: SignInDto,
    req?: any
  ): Promise<
    | AuthTokenResponse
    | { twoFactorEnabled: true; tempToken: string }
    | { loginApprovalRequired: true; message: string; sessionId: string }
    | { reactivationRequired: true; message: string }
  > {
    const { email, username, password, rememberMe, captchaId, captchaAnswer } = signInDto;
    const identifier = email || username;

    if (!identifier) {
      throw new BadRequestException('Email or username is required.');
    }

    // Anti-bot gate. Escalates by risk — see enforceSigninCaptcha.
    await this.enforceSigninCaptcha(identifier, captchaId, captchaAnswer);

    const user = email
      ? await this.usersService.findByEmail(email)
      : await this.usersService.findByUsername(username as string);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!(await bcrypt.compare(password, user.password_hash))) {
      await this.recordSecurityEvent(
        user.id,
        SecurityEventType.LOGIN_FAILED,
        SecurityEventSeverity.HIGH,
        `Failed login attempt for ${user.email ?? user.username ?? user.id}.`,
        { reason: 'invalid_password' },
        this.getRequestIp(req) ?? undefined,
        typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      await this.recordSecurityEvent(
        user.id,
        SecurityEventType.LOGIN_FAILED,
        SecurityEventSeverity.MEDIUM,
        `Login blocked for unverified account ${user.email ?? user.username ?? user.id}.`,
        { reason: 'email_unverified' },
        this.getRequestIp(req) ?? undefined,
        typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined
      );
      throw new UnauthorizedException('Please verify your email before logging in.');
    }

    if (user.status === 'deactivated') {
      return {
        reactivationRequired: true,
        message: 'This account is deactivated. Reactivate it to continue.',
      };
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const tempToken = this.jwtService.sign(
        {
          sub: user.id,
          purpose: 'two-factor-login',
          typ: 'two-factor',
          aud: 'zynkra-two-factor',
          rememberMe: rememberMe ?? false,
        },
        {
          secret: this.getTwoFactorSecret(),
          expiresIn: '10m',
        }
      );
      await this.recordSecurityEvent(
        user.id,
        SecurityEventType.TOTP_VERIFIED,
        SecurityEventSeverity.LOW,
        `2FA challenge initiated for ${user.email ?? user.username ?? user.id}.`,
        { rememberMe: rememberMe ?? false },
        this.getRequestIp(req) ?? undefined,
        typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined
      );
      return { twoFactorEnabled: true, tempToken };
    }

    const session = await this.createLoginSession(user, req);
    await this.notifyLoginAlert(user, session);
    await this.handleSuspiciousLogin(user, session, req);

    if (session.suspicious) {
      await this.recordSecurityEvent(
        user.id,
        SecurityEventType.LOGIN_FAILED,
        SecurityEventSeverity.HIGH,
        `Login approval required for ${user.email ?? user.username ?? user.id} from ${this.getRequestIp(req) ?? 'an unknown IP'}.`,
        {
          sessionId: session.id,
          rememberMe,
          suspicious: true,
          approvalRequired: true,
        },
        this.getRequestIp(req) ?? undefined,
        typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined
      );

      return {
        loginApprovalRequired: true,
        message: 'This login requires approval before access is granted.',
        sessionId: session.id,
      };
    }

    await this.recordSecurityEvent(
      user.id,
      SecurityEventType.LOGIN_SUCCESS,
      SecurityEventSeverity.LOW,
      `User ${user.email ?? user.username ?? user.id} signed in successfully from ${this.getRequestIp(req) ?? 'an unknown IP'}.`,
      {
        sessionId: session.id,
        rememberMe,
        suspicious: session.suspicious,
      },
      this.getRequestIp(req) ?? undefined,
      typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined
    );

    return this.createTokenResponse(user, session, rememberMe);
  }

  async reactivateAndSignIn(signInDto: SignInDto, req?: any) {
    const identifier = signInDto.email || signInDto.username;
    if (!identifier) {
      throw new BadRequestException('Email or username is required.');
    }

    const user = signInDto.email
      ? await this.usersService.findByEmail(signInDto.email)
      : await this.usersService.findByUsername(signInDto.username as string);

    if (!user || !(await bcrypt.compare(signInDto.password, user.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before reactivating your account.');
    }
    await this.usersService.reactivate(user.id);
    return this.signIn(signInDto, req);
  }

  async validateUser(email: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // We don't want to reveal that the user does not exist, so we send a generic success message.
      return { message: 'If a user with that email exists, a password reset link has been sent.' };
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

    await this.usersService.setPasswordResetToken(user.id, token, expires);
    await this.emailService.sendPasswordResetEmail(user.email, token);

    return { message: 'If a user with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const user = await this.usersService.findByPasswordResetToken(token);

    if (!user || !user.passwordResetTokenExpires || user.passwordResetTokenExpires < new Date()) {
      throw new UnauthorizedException('Invalid or expired password reset token.');
    }

    const password_hash = await bcrypt.hash(password, 10);
    user.password_hash = password_hash;
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    await this.usersService.save(user);

    await this.recordSecurityEvent(
      user.id,
      SecurityEventType.PASSWORD_RESET_COMPLETED,
      SecurityEventSeverity.HIGH,
      `User ${user.email ?? user.username ?? user.id} reset their password.`,
      { source: 'password_reset_token' }
    );

    return { message: 'Password has been reset successfully.' };
  }

  async socialLogin(req: any, res: any) {
    if (!req.user?.email) {
      throw new UnauthorizedException('Social login failed.');
    }

    const provider = 'google';
    const user = await this.usersService.findOrCreate(provider, req.user.id, req.user.email);

    if (req.user.firstName || req.user.lastName) {
      const displayName = [req.user.firstName, req.user.lastName].filter(Boolean).join(' ');
      await this.usersService.update(user.id, {
        displayName,
        avatar: req.user.picture,
      } as any);
    }

    const { access_token } = await this.issueAccessToken(user, req);
    return res.redirect(`${this.clientUrl}/auth/callback#token=${access_token}`);
  }

  async setup2FA(userId: string, token?: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactorEnabled) {
      if (!token || !user.twoFactorSecret || !this.verifyTotp(user.twoFactorSecret, token)) {
        throw new UnauthorizedException(
          'A valid 2FA token is required to replace the current authenticator.'
        );
      }
    }

    const secret = this.generateBase32Secret();
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = false;
    await this.usersService.save(user);

    return {
      secret,
      otpauthUrl: this.buildOtpAuthUrl(user, secret),
    };
  }

  async enable2FA(userId: string, token: string): Promise<{ message: string }> {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor setup has not been started.');
    }

    if (!this.verifyTotp(user.twoFactorSecret, token)) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    user.twoFactorEnabled = true;
    await this.usersService.save(user);

    await this.recordSecurityEvent(
      user.id,
      SecurityEventType.TOTP_ENABLED,
      SecurityEventSeverity.MEDIUM,
      `User ${user.email ?? user.username ?? user.id} enabled 2FA.`,
      { method: 'totp' }
    );

    return { message: 'Two-factor authentication enabled.' };
  }

  async get2FAStatus(userId: string): Promise<{ enabled: boolean; hasSecret: boolean }> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      enabled: user.twoFactorEnabled,
      hasSecret: !!user.twoFactorSecret,
    };
  }

  async getBrainwaveDevices(userId: string): Promise<
    Array<{
      id: string;
      deviceModel: string;
      firmware: string;
      registeredAt: string;
      lastUsed: string;
      accuracy: number;
    }>
  > {
    const devices = await this.brainwaveDevicesRepository.find({
      where: { user: { id: userId } },
      order: { registeredAt: 'DESC' },
    });

    return devices.map((device) => ({
      id: device.id,
      deviceModel: device.deviceModel,
      firmware: device.firmware,
      registeredAt: device.registeredAt.toISOString(),
      lastUsed: (device.lastUsed ?? device.registeredAt).toISOString(),
      accuracy: device.accuracy,
    }));
  }

  async registerBrainwaveDevice(
    userId: string,
    deviceModel?: string
  ): Promise<{ message: string; deviceId: string }> {
    const device = this.brainwaveDevicesRepository.create({
      user: { id: userId } as User,
      deviceModel: deviceModel?.trim() || 'Unspecified device',
      firmware: 'managed',
      lastUsed: new Date(),
      accuracy: 0,
    });
    const savedDevice = await this.brainwaveDevicesRepository.save(device);
    return { message: 'Device registered successfully.', deviceId: savedDevice.id };
  }

  async removeBrainwaveDevice(userId: string, deviceId: string): Promise<{ message: string }> {
    const result = await this.brainwaveDevicesRepository.delete({
      id: deviceId,
      user: { id: userId },
    });
    if (result.affected === 0) {
      throw new NotFoundException('Device not found.');
    }
    return { message: 'Device removed successfully.' };
  }

  async disable2FA(userId: string, token: string): Promise<{ message: string }> {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled.');
    }
    if (!user.twoFactorSecret) {
      throw new BadRequestException('No 2FA secret found.');
    }
    // Require valid TOTP token to disable (security best practice)
    if (!this.verifyTotp(user.twoFactorSecret, token)) {
      throw new UnauthorizedException('Invalid 2FA token');
    }
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await this.usersService.save(user);

    await this.recordSecurityEvent(
      user.id,
      SecurityEventType.TOTP_DISABLED,
      SecurityEventSeverity.MEDIUM,
      `User ${user.email ?? user.username ?? user.id} disabled 2FA.`,
      { method: 'totp' }
    );

    return { message: 'Two-factor authentication disabled.' };
  }

  async verify2FALogin(tempToken: string, token: string, req?: any): Promise<AuthTokenResponse> {
    let payload: {
      sub: string;
      purpose?: string;
      typ?: string;
      aud?: string | string[];
      rememberMe?: boolean;
    };

    try {
      payload = this.jwtService.verify(tempToken, {
        secret: this.getTwoFactorSecret(),
        audience: 'zynkra-two-factor',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired login challenge.');
    }

    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (
      payload.purpose !== 'two-factor-login' ||
      payload.typ !== 'two-factor' ||
      !audiences.includes('zynkra-two-factor') ||
      !payload.sub
    ) {
      throw new UnauthorizedException('Invalid or expired login challenge.');
    }

    const user = await this.usersService.findOneById(payload.sub);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA is not enabled for this account.');
    }

    if (!this.verifyTotp(user.twoFactorSecret, token)) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    return this.issueAccessToken(user, req, payload.rememberMe ?? false);
  }

  async generateRecoveryCodes(userId: string): Promise<{ codes: string[] }> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const codes = Array.from({ length: 8 }, () => this.generateRecoveryCode());
    const recoveryCodeHashes = await Promise.all(codes.map((code) => bcrypt.hash(code, 10)));

    user.recoveryCodeHashes = recoveryCodeHashes;
    user.recoveryCodesGeneratedAt = new Date();
    await this.usersService.save(user);

    return { codes };
  }

  private generateRecoveryCode(): string {
    const code = randomBytes(4).toString('hex').toUpperCase();
    return `${code.slice(0, 4)}-${code.slice(4, 8)}`;
  }

  async recoverAccount(
    identifier: string,
    recoveryCode: string,
    req?: any
  ): Promise<{ access_token: string }> {
    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);

    if (!user || !user.recoveryCodeHashes?.length) {
      throw new UnauthorizedException('Invalid recovery credentials.');
    }

    const normalizedRecoveryCode = recoveryCode.trim().toUpperCase();
    const matchingIndex = await this.findRecoveryCodeIndex(
      user.recoveryCodeHashes,
      normalizedRecoveryCode
    );

    if (matchingIndex === -1) {
      throw new UnauthorizedException('Invalid recovery credentials.');
    }

    user.recoveryCodeHashes = user.recoveryCodeHashes.filter((_, index) => index !== matchingIndex);
    await this.usersService.save(user);

    return this.issueAccessToken(user, req);
  }

  async getRecoveryOptions(identifier: string): Promise<{
    methods: {
      passwordReset: boolean;
      recoveryCodes: boolean;
      trustedContacts: string[];
    };
  }> {
    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);

    return {
      methods: {
        passwordReset: Boolean(user?.email),
        recoveryCodes: Boolean(user?.recoveryCodeHashes?.length),
        trustedContacts: (user?.trustedRecoveryContacts ?? []).map((email) =>
          this.maskEmail(email)
        ),
      },
    };
  }

  async getTrustedRecoveryContacts(userId: string): Promise<{ contacts: string[] }> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { contacts: user.trustedRecoveryContacts ?? [] };
  }

  async setTrustedRecoveryContacts(
    userId: string,
    contacts: string[]
  ): Promise<{ contacts: string[]; message: string }> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalizedContacts = Array.from(
      new Set(
        contacts.map((email) => email.trim().toLowerCase()).filter((email) => email.includes('@'))
      )
    ).slice(0, 5);

    user.trustedRecoveryContacts = normalizedContacts;
    await this.usersService.save(user);

    return {
      contacts: normalizedContacts,
      message: 'Trusted recovery contacts updated.',
    };
  }

  async requestTrustedContactRecovery(
    identifier: string,
    contactEmail: string
  ): Promise<{ message: string }> {
    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);

    if (!user) {
      return { message: 'If the account exists, a recovery challenge has been sent.' };
    }

    const normalizedContactEmail = contactEmail.trim().toLowerCase();
    const trustedContacts = user.trustedRecoveryContacts ?? [];

    if (!trustedContacts.includes(normalizedContactEmail)) {
      return { message: 'If the account exists, a recovery challenge has been sent.' };
    }

    const code = randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    user.trustedRecoveryCodeHash = this.hashRecoveryCode(code);
    user.trustedRecoveryCodeExpiresAt = expiresAt;
    await this.usersService.save(user);

    await this.emailService.sendTrustedRecoveryCodeEmail(normalizedContactEmail, code);

    return { message: 'If the account exists, a recovery challenge has been sent.' };
  }

  async verifyTrustedContactRecovery(
    identifier: string,
    contactEmail: string,
    code: string,
    req?: any
  ): Promise<{ access_token: string }> {
    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid recovery credentials.');
    }

    const normalizedContactEmail = contactEmail.trim().toLowerCase();
    if (!(user.trustedRecoveryContacts ?? []).includes(normalizedContactEmail)) {
      throw new UnauthorizedException('Invalid recovery credentials.');
    }

    if (
      !user.trustedRecoveryCodeHash ||
      !user.trustedRecoveryCodeExpiresAt ||
      user.trustedRecoveryCodeExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Recovery challenge expired.');
    }

    const isValidCode =
      this.hashRecoveryCode(code.trim().toUpperCase()) === user.trustedRecoveryCodeHash;
    if (!isValidCode) {
      throw new UnauthorizedException('Invalid recovery credentials.');
    }

    user.trustedRecoveryCodeHash = null;
    user.trustedRecoveryCodeExpiresAt = null;
    await this.usersService.save(user);

    return this.issueAccessToken(user, req);
  }

  private async findRecoveryCodeIndex(
    hashedCodes: string[],
    recoveryCode: string
  ): Promise<number> {
    for (let index = 0; index < hashedCodes.length; index += 1) {
      const isMatch = await bcrypt.compare(recoveryCode, hashedCodes[index]);
      if (isMatch) {
        return index;
      }
    }

    return -1;
  }

  private serializeLoginSession(session: LoginSession, currentSessionId?: string) {
    return {
      id: session.id,
      deviceName: session.deviceName,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      revokedAt: session.revokedAt,
      lastSeenAt: session.lastSeenAt,
      approvedAt: session.approvedAt,
      suspicious: session.suspicious,
      isTrusted: session.isTrusted,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      isCurrent: session.id === currentSessionId,
      isRevoked: Boolean(session.revokedAt),
      isApproved: Boolean(session.approvedAt),
      user: session.user
        ? {
            id: session.user.id,
            username: session.user.username,
            displayName: session.user.displayName,
            avatar: session.user.avatar,
          }
        : undefined,
    };
  }

  async getLoginSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.loginSessionsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    return sessions.map((session) => this.serializeLoginSession(session, currentSessionId));
  }

  async getPendingLoginSessions(userId: string) {
    const sessions = await this.loginSessionsRepository.find({
      where: { user: { id: userId }, revokedAt: null, approvedAt: null },
      order: { createdAt: 'DESC' },
    });

    return sessions.map((session) => this.serializeLoginSession(session));
  }

  async approveLoginSession(userId: string, sessionId: string): Promise<{ message: string }> {
    const session = await this.loginSessionsRepository.findOne({
      where: { id: sessionId, user: { id: userId }, revokedAt: null },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.approvedAt = new Date();
    await this.loginSessionsRepository.save(session);

    return { message: 'Session approved.' };
  }

  async revokeLoginSession(userId: string, sessionId: string): Promise<{ message: string }> {
    const session = await this.loginSessionsRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.revokedAt = new Date();
    await this.loginSessionsRepository.save(session);

    return { message: 'Session revoked.' };
  }

  async refreshToken(userId: string, sessionId?: string): Promise<AuthTokenResponse> {
    if (!sessionId) {
      throw new BadRequestException('No active session to refresh.');
    }

    const session = await this.loginSessionsRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: ['user'],
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session is invalid or has been revoked.');
    }

    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.loginSessionsRepository.update(session.id, { lastSeenAt: new Date() });

    return this.createTokenResponse(user, session, session.isTrusted);
  }

  async refreshFromToken(token: string): Promise<AuthTokenResponse> {
    let payload: { sub?: string; sid?: string; typ?: string; aud?: string | string[] };

    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string' ||
      (payload.typ !== 'refresh' && payload.typ !== undefined) ||
      (payload.aud !== undefined && !audiences.includes(this.getTokenAudience()))
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    return this.refreshToken(payload.sub, payload.sid);
  }

  async signOut(sessionId?: string): Promise<{ message: string }> {
    if (sessionId) {
      const session = await this.loginSessionsRepository.findOne({
        where: { id: sessionId },
      });

      if (session) {
        session.revokedAt = new Date();
        await this.loginSessionsRepository.save(session);
      }
    }

    return { message: 'Signed out successfully.' };
  }

  async revokeAllOtherSessions(
    userId: string,
    currentSessionId?: string
  ): Promise<{ message: string }> {
    const sessions = await this.loginSessionsRepository.find({
      where: { user: { id: userId } },
    });

    const sessionsToRevoke = sessions.filter(
      (session) => session.id !== currentSessionId && !session.revokedAt
    );

    for (const session of sessionsToRevoke) {
      session.revokedAt = new Date();
      await this.loginSessionsRepository.save(session);
    }

    return { message: 'Other sessions revoked.' };
  }
}
