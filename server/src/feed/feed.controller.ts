import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { FeedService } from './feed.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('for-you')
  @UseGuards(OptionalJwtAuthGuard)
  getForYouFeed(@Request() req) {
    return this.feedService.getForYouFeed(req.user);
  }

  @Get('chronological')
  @UseGuards(OptionalJwtAuthGuard)
  getChronologicalFeed(@Request() req) {
    return this.feedService.getChronologicalFeed(req.user);
  }

  @Get('shorts')
  @UseGuards(OptionalJwtAuthGuard)
  getShortsFeed(@Request() req) {
    return this.feedService.getShortsFeed(req.user);
  }

  @Get('stories')
  @UseGuards(OptionalJwtAuthGuard)
  getStoryFeed(@Request() req) {
    return this.feedService.getStoryFeed(req.user);
  }

  @Get('favorites')
  @UseGuards(OptionalJwtAuthGuard)
  getFavoritesFeed(@Request() req) {
    return this.feedService.getFavoritesFeed(req.user);
  }

  @Get('friends')
  @UseGuards(OptionalJwtAuthGuard)
  getFriendsFeed(@Request() req) {
    return this.feedService.getFriendsFeed(req.user);
  }

  @Get('subscriptions')
  @UseGuards(OptionalJwtAuthGuard)
  getSubscriptionsFeed(@Request() req) {
    return this.feedService.getSubscriptionsFeed(req.user);
  }

  @Get('local')
  @UseGuards(JwtAuthGuard)
  getLocalFeed(@Request() req, @Query('radius') radius?: number) {
    return this.feedService.getLocalFeed(req.user, radius || 50);
  }

  @Get('explore')
  @UseGuards(OptionalJwtAuthGuard)
  getExploreFeed(@Request() req, @Query('category') category?: string) {
    return this.feedService.getExploreFeed(req.user, category);
  }

  @Get('explore/categories')
  @UseGuards(OptionalJwtAuthGuard)
  getExploreCategories() {
    return this.feedService.getExploreCategories();
  }

  @Get('visual-discovery')
  @UseGuards(OptionalJwtAuthGuard)
  getVisualDiscoveryFeed(@Request() req, @Query('category') category?: string, @Query('skip') skip?: number) {
    return this.feedService.getVisualDiscoveryFeed(req.user, category, skip || 0);
  }

  @Get('visual-discovery/categories')
  @UseGuards(OptionalJwtAuthGuard)
  getVisualCategories() {
    return this.feedService.getVisualCategories();
  }
}