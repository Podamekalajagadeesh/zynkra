import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Session,
  BadRequestException,
  UnauthorizedException,
  Get,
  Delete,
  Param,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { issueCsrfToken, CsrfGuard } from '../common/csrf/csrf.guard';

import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { WebauthnService } from './webauthn.service';
import { SignUpDto } from './dto/sign-up.dto';
import {
  RefreshTokenDto,
  SignInDto,
  TwoFactorSetupDto,
  TwoFactorTokenDto,
  VerifyCodeDto,
  VerifyTwoFactorLoginDto,
} from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MagicLinkRequestDto } from './dto/magic-link-request.dto';
import { MagicLinkVerifyDto } from './dto/magic-link-verify.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AccountLinkingService } from '../features/account-management/account-linking.service';
import { LinkedAccountProvider } from '../features/account-management/entities/linked-account.entity';

// Strict limits for credential-guessing surfaces (per IP).
const STRICT = { default: { ttl: 60_000, limit: 100 } };
// Endpoints that send email (signup, resends, password reset) — keep abuse low.
const EMAIL_SENDING = { default: { ttl: 300_000, limit: 50 } };
// Token exchange. This endpoint is a pure guessability surface: it takes a
// refresh token and mints an access token, so it needs its own tight bucket
// rather than relying on the 300/min global limit. 20/min per IP is generous
// for a real client (which refreshes at most every few minutes) while making
// brute-force impractical.
const TOKEN_EXCHANGE = { default: { ttl: 60_000, limit: 20 } };
// Redeeming a 6-digit email verification code. There is no per-account attempt
// counter on that flow, so the throttle is the only thing standing between an
// attacker and a 1-in-a-million guess; 10/min keeps that search space large
// while still permitting a fat-fingered user to retry.
const VERIFICATION_CODE = { default: { ttl: 60_000, limit: 10 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
    private readonly webauthnService: WebauthnService,
    private readonly usersService: UsersService,
    private readonly accountLinkingService: AccountLinkingService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Issue a CSRF token for this browser session.
   *
   * The session cookie is the credential behind the WebAuthn challenge, the
   * SIWE nonce, and the wallet-link nonce, so those routes need a second,
   * JS-readable factor that a cross-site page cannot copy. Fetch this once after
   * load and echo the value in the `X-CSRF-Token` header on those POSTs.
   *
   * Safe methods and bearer-token requests bypass the check, so this is not
   * needed for ordinary API calls.
   */
  @Throttle(STRICT)
  @Get('csrf-token')
  csrfToken(@Session() session: Record<string, any>, @Res({ passthrough: true }) res: Response) {
    const token = issueCsrfToken(session, res, {
      cookieName: this.configService.get<string>('CSRF_COOKIE_NAME', 'zynkra.csrf'),
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      maxAgeMs: 24 * 60 * 60 * 1000,
    });
    return { token };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req, @Res() res) {
    if (req.query.state) {
      return this.completeLinkedAccount(req, res, LinkedAccountProvider.GOOGLE);
    }
    return this.authService.socialLogin(req, res);
  }

  @Get('link/google')
  @UseGuards(AuthGuard('google'))
  startGoogleAccountLink() {}

  @Get('link/google/callback')
  @UseGuards(AuthGuard('google'))
  googleAccountLinkCallback(@Req() req, @Res() res) {
    return this.completeLinkedAccount(req, res, LinkedAccountProvider.GOOGLE);
  }

  @Get('link/facebook')
  @UseGuards(AuthGuard('facebook'))
  startFacebookAccountLink() {}

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  facebookAccountLinkCallback(@Req() req, @Res() res) {
    return this.completeLinkedAccount(req, res, LinkedAccountProvider.FACEBOOK);
  }

  @Get('link/github')
  @UseGuards(AuthGuard('github'))
  startGitHubAccountLink() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubAccountLinkCallback(@Req() req, @Res() res) {
    return this.completeLinkedAccount(req, res, LinkedAccountProvider.GITHUB);
  }

  @Get('link/discord')
  @UseGuards(AuthGuard('discord'))
  startDiscordAccountLink() {}

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  discordAccountLinkCallback(@Req() req, @Res() res) {
    return this.completeLinkedAccount(req, res, LinkedAccountProvider.DISCORD);
  }

  @Get('link/twitter')
  @UseGuards(AuthGuard('twitter'))
  startTwitterAccountLink() {}

  @Get('twitter/callback')
  @UseGuards(AuthGuard('twitter'))
  twitterAccountLinkCallback(@Req() req, @Res() res) {
    return this.completeLinkedAccount(req, res, LinkedAccountProvider.TWITTER);
  }

  @Get('link/apple')
  @UseGuards(AuthGuard('apple'))
  startAppleAccountLink() {}

  @Get('apple/callback')
  @UseGuards(AuthGuard('apple'))
  appleAccountLinkCallback(@Req() req, @Res() res) {
    return this.completeLinkedAccount(req, res, LinkedAccountProvider.APPLE);
  }

  private async completeLinkedAccount(req: any, res: any, provider: LinkedAccountProvider) {
    const userId = this.accountLinkingService.verifyOAuthState(req.query.state, provider);
    await this.accountLinkingService.linkOAuthAccount(userId, provider, req.user);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/settings?linked=${provider}`);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  async setupTwoFactor(@Request() req, @Body() body: TwoFactorSetupDto) {
    return this.authService.setup2FA(req.user.userId, body?.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enableTwoFactor(@Request() req, @Body() body: TwoFactorTokenDto) {
    return this.authService.enable2FA(req.user.userId, body.token);
  }

  @Throttle(STRICT)
  @Post('2fa/verify')
  async verifyTwoFactor(@Req() req, @Body() body: VerifyTwoFactorLoginDto) {
    return this.authService.verify2FALogin(body.tempToken, body.token, req);
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  async getTwoFactorStatus(@Req() req) {
    return this.authService.get2FAStatus(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  async disableTwoFactor(@Req() req, @Body() body: TwoFactorTokenDto) {
    return this.authService.disable2FA(req.user.userId, body.token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('brainwave/devices')
  async getBrainwaveDevices(@Request() req) {
    return this.authService.getBrainwaveDevices(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('brainwave/devices/register')
  async registerBrainwaveDevice(@Request() req, @Body() body: { deviceModel?: string }) {
    return this.authService.registerBrainwaveDevice(req.user.userId, body?.deviceModel);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('brainwave/devices/:id')
  async removeBrainwaveDevice(@Request() req, @Param('id') id: string) {
    return this.authService.removeBrainwaveDevice(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('recovery-codes')
  async generateRecoveryCodes(@Request() req) {
    return this.authService.generateRecoveryCodes(req.user.userId);
  }

  @Throttle(STRICT)
  @Post('recover')
  async recoverAccount(@Req() req, @Body() body: { identifier: string; recoveryCode: string }) {
    return this.authService.recoverAccount(body.identifier, body.recoveryCode, req);
  }

  @Get('recovery/options')
  async getRecoveryOptions(@Query('identifier') identifier: string) {
    return this.authService.getRecoveryOptions(identifier || '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('recovery/trusted-contacts')
  async getTrustedRecoveryContacts(@Request() req) {
    return this.authService.getTrustedRecoveryContacts(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('recovery/trusted-contacts')
  async setTrustedRecoveryContacts(@Request() req, @Body() body: { contacts: string[] }) {
    return this.authService.setTrustedRecoveryContacts(req.user.userId, body.contacts || []);
  }

  @Throttle(EMAIL_SENDING)
  @Post('recovery/contact/request')
  async requestTrustedContactRecovery(@Body() body: { identifier: string; contactEmail: string }) {
    return this.authService.requestTrustedContactRecovery(body.identifier, body.contactEmail);
  }

  @Throttle(STRICT)
  @Post('recovery/contact/verify')
  async verifyTrustedContactRecovery(
    @Req() req,
    @Body() body: { identifier: string; contactEmail: string; code: string }
  ) {
    return this.authService.verifyTrustedContactRecovery(
      body.identifier,
      body.contactEmail,
      body.code,
      req
    );
  }

  /**
   * Issues an arithmetic CAPTCHA. This is an anti-bot speed bump, not proof of
   * a human — the expression is returned to the client, so scripts can solve it.
   */
  @Throttle(STRICT)
  @Get('captcha')
  captcha() {
    return this.captchaService.generate();
  }

  @Throttle(EMAIL_SENDING)
  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Throttle(STRICT)
  @Get('check-email')
  async checkEmailAvailability(@Query('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    return { available: !user };
  }

  @Throttle(STRICT)
  @Get('check-username')
  async checkUsernameAvailability(@Query('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    return { available: !user };
  }

  @Throttle(EMAIL_SENDING)
  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerification(body.email);
  }

  @Throttle(VERIFICATION_CODE)
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  verifyByCode(@Req() req, @Body() body: VerifyCodeDto) {
    return this.authService.verifyByCode(body.email, body.code, req);
  }

  @Throttle(STRICT)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signIn(@Req() req, @Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto, req);
  }

  @Throttle(STRICT)
  @Post('reactivate')
  @HttpCode(HttpStatus.OK)
  reactivate(@Req() req, @Body() signInDto: SignInDto) {
    return this.authService.reactivateAndSignIn(signInDto, req);
  }

  @Throttle(TOKEN_EXCHANGE)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req, @Body() body: RefreshTokenDto) {
    const authorization = req.headers?.authorization;
    const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const token = body?.refresh_token?.trim() || bearerToken;
    if (!token) {
      throw new BadRequestException('A refresh token is required.');
    }
    return this.authService.refreshFromToken(token);
  }

  @Throttle(EMAIL_SENDING)
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle(STRICT)
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
  }

  @Throttle(EMAIL_SENDING)
  @Post('magic-link/request')
  async requestMagicLink(@Body() magicLinkRequestDto: MagicLinkRequestDto) {
    return this.authService.requestMagicLink(magicLinkRequestDto.email);
  }

  @Post('guest')
  @HttpCode(HttpStatus.CREATED)
  async createGuestUser(@Req() req: any) {
    return this.authService.guestSignIn(req);
  }

  @Post('anonymous')
  @HttpCode(HttpStatus.CREATED)
  async createAnonymousUser(@Req() req: any) {
    return this.authService.anonymousSignIn(req);
  }

  @Throttle(STRICT)
  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMagicLink(@Req() req, @Body() magicLinkVerifyDto: MagicLinkVerifyDto) {
    return this.authService.verifyMagicLink(magicLinkVerifyDto.token, req);
  }

  @Get('verify-email/:token')
  verifyEmail(@Req() req, @Param('token') token: string) {
    return this.authService.verifyEmail(token, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('webauthn/registration')
  async getWebAuthnRegistrationOptions(@Request() req, @Session() session: Record<string, any>) {
    const options = await this.webauthnService.getRegistrationOptions(req.user);
    session.challenge = options.challenge;
    return options;
  }

  @UseGuards(JwtAuthGuard, CsrfGuard)
  @Post('webauthn/registration/verify')
  async verifyWebAuthnRegistration(
    @Request() req,
    @Body() body,
    @Session() session: Record<string, any>
  ) {
    return this.webauthnService.verifyRegistration(req.user, body, session.challenge);
  }

  @Post('webauthn/authentication')
  async getWebAuthnAuthenticationOptions(@Body() body, @Session() session: Record<string, any>) {
    const user = await this.authService.validateUser(body.email);
    const options = await this.webauthnService.getAuthenticationOptions(user, {
      biometric: body.biometric === true,
    });
    session.challenge = options.challenge;
    session.userId = user.id;
    return options;
  }

  @UseGuards(CsrfGuard)
  @Post('webauthn/authentication/verify')
  async verifyWebAuthnAuthentication(@Body() body, @Session() session: Record<string, any>) {
    if (!session.userId || !session.challenge) {
      throw new BadRequestException('WebAuthn authentication not initiated.');
    }
    const user = await this.usersService.findOneById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found for session.');
    }

    const verification = await this.webauthnService.verifyAuthentication(
      user,
      body,
      session.challenge
    );

    if (verification.verified) {
      // After successful verification, update the authenticator counter in the database to prevent replay attacks.
      await this.webauthnService.updateAuthenticatorCounter(verification.authenticationInfo);

      const loginPayload = await this.authService.login(user, undefined, body.rememberMe === true);

      // On successful login, clear the temporary session data.
      session.challenge = undefined;
      session.userId = undefined;

      return loginPayload;
    }

    throw new UnauthorizedException('Authentication verification failed');
  }

  @UseGuards(JwtAuthGuard)
  @Get('webauthn/passkeys')
  async getPasskeys(@Request() req) {
    return this.webauthnService.getPasskeys(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@Request() req) {
    return this.authService.getLoginSessions(req.user.userId, req.user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions/pending')
  async getPendingSessions(@Request() req) {
    return this.authService.getPendingLoginSessions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/approve')
  async approveSession(@Request() req, @Param('id') id: string) {
    return this.authService.approveLoginSession(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/revoke')
  async revokeSession(@Request() req, @Param('id') id: string) {
    return this.authService.revokeLoginSession(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke-all')
  async revokeAllSessions(@Request() req) {
    return this.authService.revokeAllOtherSessions(req.user.userId, req.user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async signOut(@Request() req) {
    return this.authService.signOut(req.user?.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('webauthn/passkeys/:id')
  async deletePasskey(@Request() req, @Param('id') id: string) {
    return this.webauthnService.deletePasskey(req.user, id);
  }
}
