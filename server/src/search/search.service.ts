import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Tag } from '../tags/tag.entity';
import { Place } from '../places/entities/place.entity';
import { Event } from '../events/entities/event.entity';
import { Group } from '../groups/entities/group.entity';
import { Product } from '../marketplace/entities/product.entity';

const MAX_RESULTS = 20;

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Place)
    private readonly placesRepository: Repository<Place>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async search(query: string) {
    const q = `%${query}%`;

    const users = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.username ILIKE :q', { q })
      .orWhere('user.displayName ILIKE :q', { q })
      .limit(MAX_RESULTS)
      .getMany();

    const posts = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.content ILIKE :q', { q })
      .orderBy('post."createdAt"', 'DESC')
      .limit(MAX_RESULTS)
      .getMany();

    const hashtags = await this.tagsRepository
      .createQueryBuilder('tag')
      .where('tag.name ILIKE :q', { q })
      .limit(MAX_RESULTS)
      .getMany();

    const places = await this.placesRepository
      .createQueryBuilder('place')
      .where('place.name ILIKE :q', { q })
      .limit(MAX_RESULTS)
      .getMany();

    const groups = await this.groupsRepository
      .createQueryBuilder('group')
      .where('group.name ILIKE :q', { q })
      .limit(MAX_RESULTS)
      .getMany();

    const events = await this.eventsRepository
      .createQueryBuilder('event')
      .where('event.title ILIKE :q', { q })
      .orWhere('event.description ILIKE :q', { q })
      .limit(MAX_RESULTS)
      .getMany();

    const products = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.name ILIKE :q', { q })
      .orWhere('product.description ILIKE :q', { q })
      .limit(MAX_RESULTS)
      .getMany();

    return { users, posts, hashtags, places, groups, events, products };
  }

  async reverseImageSearch() {
    return this.postsRepository
      .createQueryBuilder('post')
      .where('post.visibility = :visibility', { visibility: 'public' })
      .andWhere('post."imageUrls" IS NOT NULL')
      .andWhere('array_length(post."imageUrls", 1) > 0')
      .leftJoinAndSelect('post.user', 'user')
      .orderBy('post."createdAt"', 'DESC')
      .limit(MAX_RESULTS)
      .getMany();
  }
}