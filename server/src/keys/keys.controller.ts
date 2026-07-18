import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KeysService } from './keys.service';

@Controller('keys')
export class KeysController {
  constructor(private readonly keysService: KeysService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  async uploadPublicKey(@Req() req, @Body('publicKey') publicKey: string) {
    return this.keysService.savePublicKey(req.user.id, publicKey);
  }

  @Get(':userId')
  async getPublicKey(@Param('userId') userId: string) {
    return this.keysService.getPublicKey(userId);
  }
}