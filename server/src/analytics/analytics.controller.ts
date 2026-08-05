import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getAnalytics(@Request() req) {
    return this.analyticsService.getAnalytics(req.user.userId);
  }

  @Get('sustainability')
  @UseGuards(JwtAuthGuard)
  getSustainability(@Request() req) {
    return this.analyticsService.getSustainabilityData(
      req.user.userId || req.user.id,
    );
  }
}