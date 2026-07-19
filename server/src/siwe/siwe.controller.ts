import { Controller, Get, Post, Body, Session, Res } from '@nestjs/common';
import { SiweMessage, generateNonce } from 'siwe';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Controller('siwe')
export class SiweController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('nonce')
  getNonce(@Session() session: Record<string, any>): string {
    // generateNonce() is cryptographically secure (Math.random is guessable).
    const nonce = generateNonce();
    session.nonce = nonce;
    return nonce;
  }

  @Post('verify')
  async verify(
    @Body() { message, signature }: { message: string; signature: string },
    @Session() session: Record<string, any>,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const siweMessage = new SiweMessage(message);
      const { data: fields } = await siweMessage.verify({
        signature,
        nonce: session.nonce,
      });
      session.nonce = null; // single use

      let user = await this.usersService.findByWalletAddress(fields.address);
      if (!user) {
        user = await this.usersService.createUser({
          walletAddress: fields.address,
        });
      }

      const payload = { sub: user.id, email: user.email };
      const accessToken = this.jwtService.sign(payload);

      session.siwe = fields;
      await new Promise<void>((resolve) => session.save(() => resolve()));

      return { access_token: accessToken };
    } catch (error) {
      session.siwe = null;
      session.nonce = null;
      session.save(() => res.status(401).send(false));
    }
  }
}