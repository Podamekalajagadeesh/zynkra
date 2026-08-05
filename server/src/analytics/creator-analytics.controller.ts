import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatorAnalyticsService } from './creator-analytics.service';

@Controller('creator-analytics')
export class CreatorAnalyticsController {
  constructor(private readonly analyticsService: CreatorAnalyticsService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Req() req) {
    return this.analyticsService.getCreatorDashboard(req.user.userId || req.user.id);
  }

  @Get('newsletters')
  @UseGuards(JwtAuthGuard)
  async getNewsletterAnalytics(@Req() req) {
    return this.analyticsService.getNewsletterAnalytics(req.user.userId || req.user.id);
  }

  @Get('courses')
  @UseGuards(JwtAuthGuard)
  async getCourseAnalytics(@Req() req) {
    return this.analyticsService.getCourseAnalytics(req.user.userId || req.user.id);
  }

  @Get('podcasts')
  @UseGuards(JwtAuthGuard)
  async getPodcastAnalytics(@Req() req) {
    return this.analyticsService.getPodcastAnalytics(req.user.userId || req.user.id);
  }

  @Get('forecast')
  @UseGuards(JwtAuthGuard)
  async getRevenueForecast(@Req() req) {
    return this.analyticsService.forecastRevenue(req.user.userId || req.user.id);
  }
}
