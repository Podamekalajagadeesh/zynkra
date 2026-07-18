import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CrossWorldTradingService } from './cross-world-trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('cross-world-trading')
export class CrossWorldTradingController {
  constructor(private readonly tradingService: CrossWorldTradingService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTrade(@Req() req: Request, @Body() body: any) {
    const sellerId = (req.user as any).id;
    return this.tradingService.createTrade(sellerId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllTrades() {
    return this.tradingService.getAllTrades();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getUserTrades(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.tradingService.getUserTrades(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getTrade(@Param('id') id: string) {
    return this.tradingService.getTradeById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  async acceptTrade(@Param('id') id: string, @Req() req: Request) {
    const buyerId = (req.user as any).id;
    return this.tradingService.acceptTrade(id, buyerId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelTrade(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.tradingService.cancelTrade(id, userId);
  }
}
