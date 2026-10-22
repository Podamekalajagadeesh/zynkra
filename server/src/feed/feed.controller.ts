import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Controller('feed')
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly usersService: UsersService,
  ) {}

  private async withViewer<T>(
    req: any,
    handler: (user: User | null) => T | Promise<T>,
    relations: string[] = [],
  ): Promise<T> {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return handler(null);
    }

    const user = relations.length
      ? await this.usersService.findOneById(userId, relations)
      : await this.usersService.findOneById(userId);
    if (!user || user.status === 'deactivated' || user.banned) {
      throw new UnauthorizedException('Account is inactive.');
    }
    return handler(user);
  }

  @Get('for-you')
  @UseGuards(OptionalJwtAuthGuard)
  getForYouFeed(@Request() req) {
    return this.withViewer(req, (user) => this.feedService.getForYouFeed(user));
  }

  @Get('chronological')
  @UseGuards(OptionalJwtAuthGuard)
  getChronologicalFeed(@Request() req) {
    return this.withViewer(req, (user) => this.feedService.getChronologicalFeed(user));
  }

  @Get('recommended')
  @UseGuards(OptionalJwtAuthGuard)
  getRecommendedFeed(@Request() req, @Query('limit') limit?: number) {
    return this.withViewer(req, (user) =>
      this.feedService.getRecommendedFeed(user, limit || 20),
    );
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getFeed(@Request() req, @Query('view') view?: string, @Query('limit') limit?: number) {
    return this.withViewer(
      req,
      (user) => this.feedService.getFeed(user, { view, limit: limit || 20 }),
      view === 'subscriptions' ? ['subscriptions', 'subscriptions.creator'] : [],
    );
  }

  @Get('shorts')
  @UseGuards(OptionalJwtAuthGuard)
  getShortsFeed(@Request() req, @Query('limit') limit?: number) {
    return this.withViewer(req, (user) => this.feedService.getShortsFeed(user, limit || 50));
  }

  @Get('stories')
  @UseGuards(OptionalJwtAuthGuard)
  getStoryFeed(@Request() req) {
    return this.withViewer(req, (user) => this.feedService.getStoryFeed(user));
  }

  @Get('favorites')
  @UseGuards(OptionalJwtAuthGuard)
  getFavoritesFeed(@Request() req) {
    return this.withViewer(req, (user) => this.feedService.getFavoritesFeed(user));
  }

  @Get('friends')
  @UseGuards(OptionalJwtAuthGuard)
  getFriendsFeed(@Request() req) {
    return this.withViewer(req, (user) => this.feedService.getFriendsFeed(user));
  }

  @Get('subscriptions')
  @UseGuards(OptionalJwtAuthGuard)
  getSubscriptionsFeed(@Request() req) {
    return this.withViewer(
      req,
      (user) => this.feedService.getSubscriptionsFeed(user),
      ['subscriptions', 'subscriptions.creator'],
    );
  }

  @Get('trending')
  @UseGuards(OptionalJwtAuthGuard)
  getTrendingFeed(@Request() req, @Query('limit') limit?: number) {
    return this.withViewer(req, (user) =>
      this.feedService.getTrendingFeed(user, limit || 20),
    );
  }

  @Get('explore')
  @UseGuards(OptionalJwtAuthGuard)
  getExploreFeed(@Request() req, @Query('category') category?: string) {
    return this.withViewer(req, (user) => this.feedService.getExploreFeed(user, category));
  }

  @Get('explore/categories')
  @UseGuards(OptionalJwtAuthGuard)
  getExploreCategories() {
    return this.feedService.getExploreCategories();
  }

  @Get('visual-discovery')
  @UseGuards(OptionalJwtAuthGuard)
  getVisualDiscoveryFeed(
    @Request() req,
    @Query('category') category?: string,
    @Query('skip') skip?: number,
  ) {
    return this.withViewer(req, (user) =>
      this.feedService.getVisualDiscoveryFeed(user, category, skip || 0),
    );
  }

  @Get('visual-discovery/categories')
  @UseGuards(OptionalJwtAuthGuard)
  getVisualCategories() {
    return this.feedService.getVisualCategories();
  }
}
