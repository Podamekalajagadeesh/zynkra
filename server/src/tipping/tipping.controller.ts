
import { Controller, Post, Body, Get, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { TippingService } from './tipping.service';
import { CreateTipDto } from './dto/create-tip.dto';

@Controller('tipping')
export class TippingController {
  constructor(private readonly tippingService: TippingService) {}

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