import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async addFavorite(user: User, postId: string): Promise<{ success: boolean }> {
    // Check if post exists
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if already favorited
    const existingFavorite = await this.favoritesRepository.findOne({
      where: { userId: user.id, postId },
    });

    if (existingFavorite) {
      throw new BadRequestException('Post is already in favorites');
    }

    // Create new favorite
    const favorite = this.favoritesRepository.create({
      user,
      post,
    });

    await this.favoritesRepository.save(favorite);
    this.logger.log(`User ${user.id} favorited post ${postId}`);

    // Increment post's favorite count
    await this.postsRepository.increment({ id: postId }, 'favoriteCount', 1);

    return { success: true };
  }

  async removeFavorite(user: User, postId: string): Promise<{ success: boolean }> {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId: user.id, postId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoritesRepository.remove(favorite);
    this.logger.log(`User ${user.id} removed post ${postId} from favorites`);

    // Decrement post's favorite count
    await this.postsRepository.decrement({ id: postId }, 'favoriteCount', 1);

    return { success: true };
  }

  async getUserFavorites(
    user: User,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await this.favoritesRepository.findAndCount({
      where: { userId: user.id },
      relations: ['post', 'post.user', 'post.media'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const posts = favorites.map(favorite => favorite.post);

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async isFavorited(user: User, postId: string): Promise<{ isFavorited: boolean }> {
    const count = await this.favoritesRepository.count({
      where: { userId: user.id, postId },
    });

    return { isFavorited: count > 0 };
  }

  async getFavoriteCount(postId: string): Promise<{ count: number }> {
    const count = await this.favoritesRepository.count({
      where: { postId },
    });

    return { count };
  }
}