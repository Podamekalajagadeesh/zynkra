import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { VirtualRealEstateService } from './virtual-real-estate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('virtual-real-estate')
export class VirtualRealEstateController {
  constructor(private readonly virtualRealEstateService: VirtualRealEstateService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-properties')
  async getMyProperties(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.virtualRealEstateService.getUserProperties(userId);
  }

  @Get('listings')
  async getListings() {
    return this.virtualRealEstateService.getActiveListings();
  }

  @UseGuards(JwtAuthGuard)
  @Post('invest')
  async invest(
    @Req() req: Request,
    @Body() body: { listingId: string; amount: number }
  ) {
    const userId = (req.user as any).id;
    return this.virtualRealEstateService.invest(userId, body.listingId, body.amount);
  }
}
