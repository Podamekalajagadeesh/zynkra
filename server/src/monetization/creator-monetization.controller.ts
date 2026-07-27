import { Controller, Get, Post, Body, UseGuards, Req, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatorMonetizationService } from './creator-monetization.service';

@Controller('creator')
export class CreatorMonetizationController {
  constructor(private readonly monetizationService: CreatorMonetizationService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  getDashboard(@Req() req) {
    return this.monetizationService.getCreatorDashboard(req.user.userId || req.user.id);
  }

  @Get('tiers')
  getTiers() {
    return this.monetizationService.getDefaultTiers();
  }

  @Post('tip')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  sendTip(@Req() req, @Body() body: { creatorId: string; amount: number; message?: string }) {
    return this.monetizationService.processTip(
      req.user.userId || req.user.id,
      body.creatorId,
      body.amount,
      body.message,
    );
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  subscribe(@Req() req, @Body() body: { creatorId: string; tierId: string }) {
    return this.monetizationService.processSubscription(
      req.user.userId || req.user.id,
      body.creatorId,
      body.tierId,
    );
  }

  @Post('pay-per-view')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  purchaseContent(@Req() req, @Body() body: {
    creatorId: string;
    contentId: string;
    contentType: 'article' | 'podcast' | 'course' | 'post';
    price: number;
  }) {
    return this.monetizationService.processPayPerView(
      req.user.userId || req.user.id,
      body.creatorId,
      body.contentId,
      body.contentType,
      body.price,
    );
  }

  @Get('earnings')
  @UseGuards(JwtAuthGuard)
  getEarnings(@Req() req) {
    return this.monetizationService.getCreatorEarnings(req.user.userId || req.user.id);
  }
}
