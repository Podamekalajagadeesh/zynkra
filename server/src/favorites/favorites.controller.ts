import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async getMyFavorites(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.favoritesService.getUserFavorites(user, page, limit);
  }

  @Get('posts/:postId/is-favorited')
  async checkIsFavorited(
    @CurrentUser() user: User,
    @Param('postId') postId: string,
  ) {
    return this.favoritesService.isFavorited(user, postId);
  }

  @Get('posts/:postId/count')
  async getPostFavoriteCount(@Param('postId') postId: string) {
    return this.favoritesService.getFavoriteCount(postId);
  }

  @Post('posts/:postId')
  async addToFavorites(
    @CurrentUser() user: User,
    @Param('postId') postId: string,
  ) {
    return this.favoritesService.addFavorite(user, postId);
  }

  @Delete('posts/:postId')
  async removeFromFavorites(
    @CurrentUser() user: User,
    @Param('postId') postId: string,
  ) {
    return this.favoritesService.removeFavorite(user, postId);
  }
}