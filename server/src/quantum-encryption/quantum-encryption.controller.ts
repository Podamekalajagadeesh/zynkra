import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { QuantumEncryptionService } from './quantum-encryption.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('quantum-encryption')
@UseGuards(JwtAuthGuard)
export class QuantumEncryptionController {
  constructor(private readonly quantumEncryptionService: QuantumEncryptionService) {}

  @Post('keys')
  async generateKey(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.quantumEncryptionService.generateQuantumKey(userId, body.algorithms);
  }

  @Get('keys')
  async getKeys(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.quantumEncryptionService.getUserKeys(userId);
  }

  @Patch('keys/:id/revoke')
  async revokeKey(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.quantumEncryptionService.revokeKey(id, userId);
  }

  @Post('encrypt')
  async encrypt(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.quantumEncryptionService.encryptNeuralData(
      userId,
      body.data,
      body.keyId,
      body.accessControlList,
    );
  }

  @Get('records')
  async getRecords(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.quantumEncryptionService.getUserEncryptedRecords(userId);
  }

  @Get('records/:id/decrypt')
  async decrypt(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.quantumEncryptionService.decryptNeuralData(id, userId);
  }

  @Get('stats')
  async getStats(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.quantumEncryptionService.getEncryptionStats(userId);
  }
}
