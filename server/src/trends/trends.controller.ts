import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { TrendsService } from './trends.service';
import { PlacesService } from '../places/places.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Trend } from './entities/trend.entity';
import { User } from '../users/entities/user.entity';

@Controller('trends')
export class TrendsController {
  constructor(
    private readonly trendsService: TrendsService,
    private readonly placesService: PlacesService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getTrending(
    @Request() req,
    @Query('limit') limit: string = '10',
    @Query('days') days: string = '7',
    @Query('location') location?: string,
  ): Promise<{ globalTrends: Trend[]; locationBasedTrends: Trend[]; trendingPlaces: any[]; limit: number; days: number }> {
    const limitNumber = parseInt(limit, 10);
    const daysNumber = parseInt(days, 10);
    const globalTrends = await this.trendsService.getTrending(limitNumber, daysNumber);
    
    // Get location-based trends if location is provided
    let locationBasedTrends: Trend[] = [];
    if (location) {
      locationBasedTrends = await this.trendsService.getTrendingByLocation(location, limitNumber, daysNumber);
    }

    // Get trending places regardless
    const trendingPlaces = await this.placesService.getTrendingPlaces(5);
    
    return {
      globalTrends,
      locationBasedTrends,
      trendingPlaces,
      limit: limitNumber,
      days: daysNumber,
    };
  }

  @Get(':tag')
  async getTrendDetails(
    @Param('tag') tag: string,
    @Query('days') days: string = '30',
  ): Promise<Trend | null> {
    const daysNumber = parseInt(days, 10);
    return this.trendsService.getTrendHistory(tag, daysNumber);
  }

  @Get('user/preferences')
  @UseGuards(OptionalJwtAuthGuard)
  async getUserCustomizedTrends(
    @Request() req,
    @Query('limit') limit: string = '10',
  ): Promise<Trend[]> {
    const limitNumber = parseInt(limit, 10);
    const userId = req.user?.id;
    
    if (userId) {
      return this.trendsService.getPersonalizedTrends(userId, limitNumber);
    }
    
    // Fallback to global trends if not logged in
    return this.trendsService.getTrending(limitNumber, 7);
  }
}