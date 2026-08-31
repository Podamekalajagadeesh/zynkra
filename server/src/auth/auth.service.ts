import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { createHash, createHmac, randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { LoginSession } from './entities/login-session.entity';
import { CaptchaService } from './captcha.service';
import { InviteCodesService } from '../invite-codes/invite-codes.service';
import { BrainwaveDevice } from './entities/brainwave-device.entity';

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
    const binary = ((hmac[offset] & 0x7f) << 24)
      | ((hmac[offset + 1] & 0xff) << 16)
      | ((hmac[offset + 2] & 0xff) << 8)
      | (hmac[offset + 3] & 0xff);
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
    const forwardedFor = req?.headers?.['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return forwardedFor.split(',')[0].trim();
    }

    if (typeof req?.ip === 'string' && req.ip.length > 0) {
      return req.ip;
    }

    return null;
  }

  private async createLoginSession(user: User, req?: any, isTrusted = false): Promise<LoginSession> {
    const suspicious = isTrusted ? false : await this.isSuspiciousSession(user.id, req);
    const session = this.loginSessionsRepository.create({
      user,
      deviceName: this.getRequestDeviceName(req),
      userAgent: typeof req?.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : null,
      ipAddress: this.getRequestIp(req),
      lastSeenAt: new Date(),
      revokedAt: null,
      approvedAt: suspicious ? null : new Date(),
      suspicious,
      isTrusted,
    });

    return this.loginSessionsRepository.save(session);
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
    await this.notificationsService.createNotification(
      user,
      NotificationType.LOGIN_ALERT,
      {
        sessionId: session.id,
        deviceName: session.deviceName,
        ipAddress: session.ipAddress,
        suspicious: session.suspicious,
      },
    );

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
      rememberMe ? '30d' : '60m',
    ) as StringValue;
  }

  private async issueAccessToken(user: User, req?: any, rememberMe = false): Promise<{ access_token: string }> {
    const session = await this.createLoginSession(user, req, rememberMe);
    await this.notifyLoginAlert(user, session);
    const payload = { sub: user.id, email: user.email, sid: session.id };
    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: this.getTokenExpiry(rememberMe),
      }),
    };
  }

  async login(user: User, req?: any, rememberMe = false): Promise<{ access_token: string }> {
    return this.issueAccessToken(user, req, rememberMe);
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
    if (!user || !user.magicLinkTokenExpiresAt || user.magicLinkTokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('This sign-in link is invalid or has expired.');
    }

    user.magicLinkTokenHash = null;
    user.magicLinkTokenExpiresAt = null;
    user.emailVerified = true;
    await this.usersService.save(user);

    return this.issueAccessToken(user, req);
  }

  async signUp(signUpDto: SignUpDto): Promise<{ message: string }> {
    const { username, email, password, birthDate, captchaId, captchaAnswer, inviteCode } = signUpDto;

    if (!this.captchaService.verify(captchaId, captchaAnswer)) {
      throw new BadRequestException('CAPTCHA failed or expired. Please try again.');
    }

    const minimumAge = this.configService.get<number>('MINIMUM_AGE', 13);
    const age = this.computeAge(birthDate);
    if (age === null || age < minimumAge) {
      throw new BadRequestException(`You must be at least ${minimumAge} years old to register.`);
    }

    const inviteRequired = this.configService.get<string>('INVITE_CODE_REQUIRED', 'false') === 'true';
    if (inviteRequired && !inviteCode) {
      throw new BadRequestException('An invite code is required to register.');
    }
    let consumeInvite = false;
    if (inviteCode) {
      consumeInvite = this.inviteCodesService.isUsable(await this.inviteCodesService.findByCode(inviteCode));
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
    const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
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

    const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const emailVerificationTokenExpires = new Date();
    emailVerificationTokenExpires.setHours(emailVerificationTokenExpires.getHours() + 1);

    user.emailVerificationToken = emailVerificationCode;
    user.emailVerificationTokenExpires = emailVerificationTokenExpires;
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

    return this.issueAccessToken(user, req);
  }

  async verifyByCode(email: string, code: string, req?: any): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or code');
    }

    if (user.emailVerified) {
      return this.issueAccessToken(user, req);
    }

    if (user.emailVerificationToken !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (user.emailVerificationTokenExpires < new Date()) {
      throw new UnauthorizedException('Verification code has expired');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    await this.usersRepository.save(user);

    return this.issueAccessToken(user, req);
  }

  async signIn(signInDto: SignInDto, req?: any): Promise<{ access_token: string } | { twoFactorEnabled: true; tempToken: string }> {
    const { email, username, password, rememberMe } = signInDto;
    const identifier = email || username;

    if (!identifier) {
      throw new BadRequestException('Email or username is required.');
    }

    const user = email
      ? await this.usersService.findByEmail(email)
      : await this.usersService.findByUsername(username as string);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, purpose: 'two-factor-login', rememberMe: rememberMe ?? false },
        { expiresIn: '10m' },
      );
      return { twoFactorEnabled: true, tempToken };
    }

    return this.issueAccessToken(user, req, rememberMe);
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

  async setup2FA(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
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

  async getBrainwaveDevices(userId: string): Promise<Array<{
    id: string;
    deviceModel: string;
    firmware: string;
    registeredAt: string;
    lastUsed: string;
    accuracy: number;
  }>> {
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

  async registerBrainwaveDevice(userId: string, deviceModel?: string): Promise<{ message: string; deviceId: string }> {
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
    const result = await this.brainwaveDevicesRepository.delete({ id: deviceId, user: { id: userId } });
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
    return { message: 'Two-factor authentication disabled.' };
  }

  async verify2FALogin(tempToken: string, token: string, req?: any): Promise<{ access_token: string }> {
    let payload: { sub: string; purpose?: string; rememberMe?: boolean };

    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired login challenge.');
    }

    if (payload.purpose !== 'two-factor-login') {
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

  async recoverAccount(identifier: string, recoveryCode: string, req?: any): Promise<{ access_token: string }> {
    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);

    if (!user || !user.recoveryCodeHashes?.length) {
      throw new UnauthorizedException('Invalid recovery credentials.');
    }

    const normalizedRecoveryCode = recoveryCode.trim().toUpperCase();
    const matchingIndex = await this.findRecoveryCodeIndex(user.recoveryCodeHashes, normalizedRecoveryCode);

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
        trustedContacts: (user?.trustedRecoveryContacts ?? []).map((email) => this.maskEmail(email)),
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

  async setTrustedRecoveryContacts(userId: string, contacts: string[]): Promise<{ contacts: string[]; message: string }> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalizedContacts = Array.from(
      new Set(
        contacts
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email.includes('@')),
      ),
    ).slice(0, 5);

    user.trustedRecoveryContacts = normalizedContacts;
    await this.usersService.save(user);

    return {
      contacts: normalizedContacts,
      message: 'Trusted recovery contacts updated.',
    };
  }

  async requestTrustedContactRecovery(identifier: string, contactEmail: string): Promise<{ message: string }> {
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
    req?: any,
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

    if (!user.trustedRecoveryCodeHash || !user.trustedRecoveryCodeExpiresAt || user.trustedRecoveryCodeExpiresAt < new Date()) {
      throw new UnauthorizedException('Recovery challenge expired.');
    }

    const isValidCode = this.hashRecoveryCode(code.trim().toUpperCase()) === user.trustedRecoveryCodeHash;
    if (!isValidCode) {
      throw new UnauthorizedException('Invalid recovery credentials.');
    }

    user.trustedRecoveryCodeHash = null;
    user.trustedRecoveryCodeExpiresAt = null;
    await this.usersService.save(user);

    return this.issueAccessToken(user, req);
  }

  private async findRecoveryCodeIndex(hashedCodes: string[], recoveryCode: string): Promise<number> {
    for (let index = 0; index < hashedCodes.length; index += 1) {
      const isMatch = await bcrypt.compare(recoveryCode, hashedCodes[index]);
      if (isMatch) {
        return index;
      }
    }

    return -1;
  }

  async getLoginSessions(userId: string, currentSessionId?: string): Promise<Array<LoginSession & { isCurrent: boolean; isRevoked: boolean; isApproved: boolean }>> {
    const sessions = await this.loginSessionsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    return sessions.map((session) => ({
      ...session,
      isCurrent: session.id === currentSessionId,
      isRevoked: Boolean(session.revokedAt),
      isApproved: Boolean(session.approvedAt),
    }));
  }

  async getPendingLoginSessions(userId: string): Promise<Array<LoginSession & { isCurrent: boolean; isRevoked: boolean; isApproved: boolean }>> {
    const sessions = await this.loginSessionsRepository.find({
      where: { user: { id: userId }, revokedAt: null, approvedAt: null },
      order: { createdAt: 'DESC' },
    });

    return sessions.map((session) => ({
      ...session,
      isCurrent: false,
      isRevoked: false,
      isApproved: false,
    }));
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

  async refreshToken(userId: string, sessionId?: string): Promise<{ access_token: string }> {
    if (!sessionId) {
      throw new BadRequestException('No active session to refresh.');
    }

    const session = await this.loginSessionsRepository.findOne({
      where: { id: sessionId },
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session is invalid or has been revoked.');
    }

    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.loginSessionsRepository.update(session.id, { lastSeenAt: new Date() });

    const payload = { sub: user.id, email: user.email, sid: session.id };
    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: this.getTokenExpiry(session.isTrusted),
      }),
    };
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

  async revokeAllOtherSessions(userId: string, currentSessionId?: string): Promise<{ message: string }> {
    const sessions = await this.loginSessionsRepository.find({
      where: { user: { id: userId } },
    });

    const sessionsToRevoke = sessions.filter((session) => session.id !== currentSessionId && !session.revokedAt);

    for (const session of sessionsToRevoke) {
      session.revokedAt = new Date();
      await this.loginSessionsRepository.save(session);
    }

    return { message: 'Other sessions revoked.' };
  }
}