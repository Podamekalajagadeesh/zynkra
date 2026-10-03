import { Controller, Get, Post, Body, Session, Req, Logger, UnauthorizedException, UseGuards } from '@nestjs/common';
import { SiweMessage, generateNonce } from 'siwe';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginSession } from '../auth/entities/login-session.entity';
import { CsrfGuard, issueCsrfToken } from '../common/csrf/csrf.guard';

@Controller('siwe')
export class SiweController {
  private readonly logger = new Logger(SiweController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(LoginSession)
    private readonly loginSessionsRepository: Repository<LoginSession>,
  ) {}

  /**
   * The session cookie is the only thing carrying the SIWE nonce, so a
   * cross-site page could otherwise drive a signature request in a victim's
   * browser. This mints a CSRF token alongside the nonce (in the cookie and the
   * `X-CSRF-Token` response header) so the client already has one before it
   * signs. Returns a bare nonce string — that shape is part of the contract.
   */
  @Get('nonce')
  getNonce(
    @Session() session: Record<string, any>,
    @Res({ passthrough: true }) res: import('express').Response,
  ): string {
    // generateNonce() is cryptographically secure (Math.random is guessable).
    const nonce = generateNonce();
    session.nonce = nonce;

    issueCsrfToken(session, res, {
      cookieName: this.configService.get<string>('CSRF_COOKIE_NAME', 'zynkra.csrf'),
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      maxAgeMs: 24 * 60 * 60 * 1000,
    });

    return nonce;
  }

  @UseGuards(CsrfGuard)
  @Post('verify')
  async verify(
    @Body() { message, signature }: { message: string; signature: string },
    @Session() session: Record<string, any>,
    @Req() req: Request,
  ) {
    // The nonce is single-use: clear it before any await so a failed or
    // replayed attempt cannot reuse it.
    const expectedNonce = session.nonce;
    session.nonce = null;

    if (!expectedNonce) {
      throw new UnauthorizedException('No SIWE nonce in session. Request GET /siwe/nonce first.');
    }

    let fields;
    try {
      const siweMessage = new SiweMessage(message);
      ({ data: fields } = await siweMessage.verify({
        signature,
        nonce: expectedNonce,
      }));
    } catch (error) {
      this.logger.warn(
        `SIWE signature verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Invalid SIWE signature.');
    }

    let user = await this.usersService.findByWalletAddress(fields.address);
    if (!user) {
      user = await this.usersService.createUser({
        walletAddress: fields.address,
      });
    }

    // A LoginSession is required, not optional: JwtStrategy looks the session up
    // by `sid` on every request and rejects the token if it is missing or
    // revoked. Without this row the issued token is unusable.
    const loginSession = this.loginSessionsRepository.create({
      user,
      deviceName: 'Wallet',
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.ip ?? null,
      lastSeenAt: new Date(),
    });
    const savedSession = await this.loginSessionsRepository.save(loginSession);

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        sid: savedSession.id,
        typ: 'access',
        aud: this.configService.get<string>('JWT_AUDIENCE', 'zynkra-api'),
      },
      { expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '60m') as any },
    );

    session.siwe = fields;

    return { access_token: accessToken };
  }
}
