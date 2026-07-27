import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PreKeysService } from './prekeys.service';

@Controller('keys')
export class PreKeysController {
  constructor(private readonly preKeysService: PreKeysService) {}

  @UseGuards(JwtAuthGuard)
  @Post('identity')
  @HttpCode(HttpStatus.OK)
  async uploadIdentityKey(
    @Req() req,
    @Body('identityKey') identityKey: string,
  ): Promise<void> {
    await this.preKeysService.uploadIdentityKey(req.user.id, identityKey);
  }

  @UseGuards(JwtAuthGuard)
  @Post('signed-prekey')
  @HttpCode(HttpStatus.OK)
  async uploadSignedPreKey(
    @Req() req,
    @Body('keyId') keyId: number,
    @Body('publicKey') publicKey: string,
    @Body('signature') signature: string,
  ): Promise<void> {
    await this.preKeysService.uploadSignedPreKey(
      req.user.id,
      keyId,
      publicKey,
      signature,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('one-time-prekeys')
  @HttpCode(HttpStatus.OK)
  async uploadOneTimePreKeys(
    @Req() req,
    @Body('preKeys') preKeys: Array<{ keyId: number; publicKey: string }>,
  ): Promise<{ count: number }> {
    const count = await this.preKeysService.uploadOneTimePreKeys(
      req.user.id,
      preKeys,
    );
    return { count };
  }

  @UseGuards(JwtAuthGuard)
  @Post('bundle')
  @HttpCode(HttpStatus.OK)
  async uploadPreKeyBundle(
    @Req() req,
    @Body()
    bundle: {
      registrationId: number;
      identityKey: string;
      signedPreKey: { keyId: number; publicKey: string; signature: string };
      oneTimePreKeys: Array<{ keyId: number; publicKey: string }>;
    },
  ): Promise<void> {
    await this.preKeysService.uploadPreKeyBundle(req.user.id, bundle);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bundle/:userId')
  async getPreKeyBundle(
    @Param('userId') userId: string,
  ): Promise<{
    registrationId: number;
    identityKey: string;
    signedPreKey: { keyId: number; publicKey: string; signature: string };
    oneTimePreKey: { keyId: number; publicKey: string } | null;
  }> {
    return this.preKeysService.getPreKeyBundle(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('prekey-count')
  async getOneTimePreKeyCount(
    @Req() req,
  ): Promise<{ count: number }> {
    const count = await this.preKeysService.getOneTimePreKeyCount(req.user.id);
    return { count };
  }
}
