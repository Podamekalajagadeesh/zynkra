
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Watchlist } from '../bookmarks/entities/watchlist.entity';
import { WatchlistService } from './watchlist.service';
import { WatchlistController } from './watchlist.controller';
import { Post } from '../posts/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Watchlist, Post])],
  controllers: [WatchlistController],
  providers: [WatchlistService],
  exports: [WatchlistService],
})
export class WatchlistModule {}