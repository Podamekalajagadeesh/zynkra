
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MemoriesService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async getTimeline(user: User): Promise<Post[]> {
    return this.postRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async getOnThisDay(user: User): Promise<Post[]> {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();

    const posts = await this.postRepository
      .createQueryBuilder('post')
      .where('post.userId = :userId', { userId: user.id })
      .andWhere('EXTRACT(MONTH FROM post.createdAt) = :month', { month: month + 1 })
      .andWhere('EXTRACT(DAY FROM post.createdAt) = :day', { day })
      .andWhere('EXTRACT(YEAR FROM post.createdAt) != :year', { year: today.getFullYear() })
      .orderBy('post.createdAt', 'DESC')
      .getMany();

    return posts;
  }
}