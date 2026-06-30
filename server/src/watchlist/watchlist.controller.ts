
import { Controller, Post, Delete, Get, Param, UseGuards, Req } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Post as PostEntity } from '../posts/entities/post.entity';

@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':postId')
  async addToWatchlist(@Param('postId') postId: string, @Req() req) {
    const post = new PostEntity();
    post.id = postId;
    return this.watchlistService.addToWatchlist(req.user, post);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':postId')
  async removeFromWatchlist(@Param('postId') postId: string, @Req() req) {
    const post = new PostEntity();
    post.id = postId;
    return this.watchlistService.removeFromWatchlist(req.user, post);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getWatchlist(@Req() req) {
    return this.watchlistService.getWatchlist(req.user);
  }
}