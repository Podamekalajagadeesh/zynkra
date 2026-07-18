import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CryptoService } from './crypto.service';
import { UsersService } from '../users/users.service';

class KeyUploadDto {
  identityKey: {
    registrationId: number;
    publicKey: string;
  };
  preKey: {
    keyId: number;
    publicKey: string;
  };
  signedPreKey: {
    keyId: number;
    publicKey: string;
    signature: string;
  };
}

@Controller('crypto')
@UseGuards(JwtAuthGuard)
export class CryptoController {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly usersService: UsersService,
  ) {}

  @Post('keys')
  async uploadKeys(@Request() req, @Body() keyUploadDto: KeyUploadDto) {
    const user = await this.usersService.findOneById(req.user.userId);
    await this.cryptoService.saveIdentityKey(
      user,
      keyUploadDto.identityKey.registrationId,
      keyUploadDto.identityKey.publicKey,
    );
    await this.cryptoService.savePreKey(
      user,
      keyUploadDto.preKey.keyId,
      keyUploadDto.preKey.publicKey,
    );
    await this.cryptoService.saveSignedPreKey(
      user,
      keyUploadDto.signedPreKey.keyId,
      keyUploadDto.signedPreKey.publicKey,
      keyUploadDto.signedPreKey.signature,
    );
    return { success: true };
  }

  @Get('keys/:userId')
  async getKeys(@Param('userId') userId: string) {
    return this.cryptoService.getKeyBundle(userId);
  }
}