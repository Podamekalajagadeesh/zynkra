
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Watchlist } from '../bookmarks/entities/watchlist.entity';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(Watchlist)
    private readonly watchlistRepository: Repository<Watchlist>,
  ) {}

  async addToWatchlist(user: User, post: Post): Promise<Watchlist> {
    const watchlistItem = this.watchlistRepository.create({ user, post });
    return this.watchlistRepository.save(watchlistItem);
  }

  async removeFromWatchlist(user: User, post: Post): Promise<void> {
    await this.watchlistRepository.delete({ user, post });
  }

  async getWatchlist(user: User): Promise<Watchlist[]> {
    return this.watchlistRepository.find({ where: { user }, relations: ['post'] });
  }
}