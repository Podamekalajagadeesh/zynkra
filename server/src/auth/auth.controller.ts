import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request, Session, BadRequestException, UnauthorizedException, Get, Delete, Param, Req, Res, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { WebauthnService } from './webauthn.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// Strict limits for credential-guessing surfaces (per IP).
const STRICT = { default: { ttl: 60_000, limit: 10 } };
// Endpoints that send email (signup, resends, password reset) — keep abuse low.
const EMAIL_SENDING = { default: { ttl: 300_000, limit: 5 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly webauthnService: WebauthnService,
    private readonly usersService: UsersService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req, @Res() res) {
    return this.authService.socialLogin(req, res);
  }



  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  async setupTwoFactor(@Request() req) {
    return this.authService.setup2FA(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enableTwoFactor(@Request() req, @Body() body: { token: string }) {
    return this.authService.enable2FA(req.user.userId, body.token);
  }

  @Throttle(STRICT)
  @Post('2fa/verify')
  async verifyTwoFactor(@Req() req, @Body() body: { tempToken: string; token: string }) {
    return this.authService.verify2FALogin(body.tempToken, body.token, req);
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  async getTwoFactorStatus(@Req() req) {
    return this.authService.get2FAStatus(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  async disableTwoFactor(@Req() req, @Body() body: { token: string }) {
    return this.authService.disable2FA(req.user.userId, body.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('recovery-codes')
  async generateRecoveryCodes(@Request() req) {
    return this.authService.generateRecoveryCodes(req.user.userId);
  }

  @Throttle(STRICT)
  @Post('recover')
  async recoverAccount(
    @Req() req,
    @Body() body: { identifier: string; recoveryCode: string },
  ) {
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
    @Body() body: { identifier: string; contactEmail: string; code: string },
  ) {
    return this.authService.verifyTrustedContactRecovery(body.identifier, body.contactEmail, body.code, req);
  }

  @Throttle(EMAIL_SENDING)
  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Throttle(EMAIL_SENDING)
  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerification(body.email);
  }

  @Throttle(STRICT)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signIn(@Req() req, @Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req) {
    return this.authService.refreshToken(req.user.userId, req.user.sessionId);
  }

  @Throttle(EMAIL_SENDING)
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle(STRICT)
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
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

  @UseGuards(JwtAuthGuard)
  @Post('webauthn/registration/verify')
  async verifyWebAuthnRegistration(@Request() req, @Body() body, @Session() session: Record<string, any>) {
    return this.webauthnService.verifyRegistration(req.user, body, session.challenge);
  }

  @Post('webauthn/authentication')
  async getWebAuthnAuthenticationOptions(@Body() body, @Session() session: Record<string, any>) {
    const user = await this.authService.validateUser(body.email);
    const options = await this.webauthnService.getAuthenticationOptions(user);
    session.challenge = options.challenge;
    session.userId = user.id;
    return options;
  }

  @Post('webauthn/authentication/verify')
  async verifyWebAuthnAuthentication(@Body() body, @Session() session: Record<string, any>) {
    if (!session.userId || !session.challenge) {
      throw new BadRequestException('WebAuthn authentication not initiated.');
    }
    const user = await this.usersService.findOneById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found for session.');
    }

    const verification = await this.webauthnService.verifyAuthentication(user, body, session.challenge);

    if (verification.verified) {
      // After successful verification, update the authenticator counter in the database to prevent replay attacks.
      await this.webauthnService.updateAuthenticatorCounter(verification.authenticationInfo);

      const loginPayload = await this.authService.login(user);

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