import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CarbonNeutralService } from './carbon-neutral.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('carbon-neutral')
export class CarbonNeutralController {
  constructor(private readonly carbonNeutralService: CarbonNeutralService) {}

  @UseGuards(JwtAuthGuard)
  @Post('transaction')
  async createTransaction(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any).id;
    return this.carbonNeutralService.createTransaction(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-transactions')
  async getMyTransactions(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.carbonNeutralService.getUserTransactions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-balance')
  async getMyBalance(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.carbonNeutralService.getUserCarbonBalance(userId);
  }

  @Get('stats')
  async getTotalStats() {
    return this.carbonNeutralService.getTotalStats();
  }
}
