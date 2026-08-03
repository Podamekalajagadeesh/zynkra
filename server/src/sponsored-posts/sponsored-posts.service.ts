import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SponsoredPost } from './entities/sponsored-post.entity';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SponsoredPostsService {
  constructor(
    @InjectRepository(SponsoredPost)
    private sponsoredPostsRepository: Repository<SponsoredPost>,
  ) {}

  async create(sponsor: User, post: Post, budget: number, expiresAt: Date): Promise<SponsoredPost> {
    const sponsoredPost = this.sponsoredPostsRepository.create({
      sponsor,
      post,
      budget,
      expiresAt,
    });

    return this.sponsoredPostsRepository.save(sponsoredPost);
  }

  async getActiveSponsoredPosts(): Promise<SponsoredPost[]> {
    return this.sponsoredPostsRepository.find({
      where: {
        expiresAt: MoreThan(new Date()),
      },
      relations: ['post', 'post.user', 'post.reactions', 'post.comments', 'post.tags'],
    });
  }
}