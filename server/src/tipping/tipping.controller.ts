
import { Controller, Post, Body, Get, UseGuards, Query, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { TippingService } from './tipping.service';
import { CreateTipDto } from './dto/create-tip.dto';

@Controller('tipping')
export class TippingController {
  constructor(private readonly tippingService: TippingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('fiat')
  createFiat(
    @Request() req,
    @Body()
    body: {
      toUserId: string;
      amount: number;
      postId?: string;
      currency?: string;
      paymentMethodId?: string;
    },
  ) {
    return this.tippingService.createFiatTip(
      req.user?.userId || req.user?.id,
      body.toUserId,
      body.amount,
      body.postId,
      body.currency ?? 'usd',
      body.paymentMethodId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createTipDto: CreateTipDto) {
    return this.tippingService.create(createTipDto);
  }

  // Public leaderboard of creators ranked by tips received.
  @UseGuards(OptionalJwtAuthGuard)
  @Get('leaderboard')
  leaderboard(
    @Query('period') period: 'all' | 'weekly' | 'monthly' = 'all',
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.tippingService.getLeaderboard(period, Number.isNaN(parsedLimit) ? 50 : parsedLimit);
  }
}