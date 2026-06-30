import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { PlacesService } from './places.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('search')
  async searchPlaces(@Query('q') query: string, @Query('limit') limit: number = 10) {
    return this.placesService.searchPlaces(query, limit);
  }

  @Get('trending')
  async getTrendingPlaces(@Query('limit') limit: number = 10) {
    return this.placesService.getTrendingPlaces(limit);
  }

  @Get(':id')
  async getPlaceById(@Param('id') id: string) {
    return this.placesService.getPlaceWithPosts(id);
  }

  @Get(':id/posts')
  async getPlacePosts(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.placesService.getPlacePosts(id, page, limit);
  }
}