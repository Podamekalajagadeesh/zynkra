import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Tag } from '../tags/tag.entity';
import { Place } from '../places/entities/place.entity';
import { Event } from '../events/entities/event.entity';
import { Group } from '../groups/entities/group.entity';
import { Product } from '../marketplace/entities/product.entity';

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
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.username ILIKE :query', { query: `%${query}%` })
      .orWhere('user.displayName ILIKE :query', { query: `%${query}%` })
      .getMany();

    const posts = await this.postsRepository
      .createQueryBuilder('post')
      .where('post.content ILIKE :query', { query: `%${query}%` })
      .getMany();

    const hashtags = await this.tagsRepository
      .createQueryBuilder('tag')
      .where('tag.name ILIKE :query', { query: `%${query}%` })
      .getMany();

    const places = await this.placesRepository
      .createQueryBuilder('place')
      .where('place.name ILIKE :query', { query: `%${query}%` })
      .getMany();

    const groups = await this.groupsRepository
      .createQueryBuilder('group')
      .where('group.name ILIKE :query', { query: `%${query}%` })
      .getMany();

    const events = await this.eventsRepository
      .createQueryBuilder('event')
      .where('event.title ILIKE :query', { query: `%${query}%` })
      .orWhere('event.description ILIKE :query', { query: `%${query}%` })
      .getMany();

    const products = await this.productsRepository.find({
      where: [
        { title: ILike(`%${query}%`) },
        { description: ILike(`%${query}%`) },
      ],
    });

    return { users, posts, hashtags, places, groups, events, products };
  }

  async reverseImageSearch(imageBuffer: Buffer) {
    // In a production environment, we would:
    // 1. Use computer vision to extract features from the uploaded image
    // 2. Compare these features with stored image embeddings in the database
    // 3. Return posts with highest visual similarity (cosine similarity)
    // For now, we'll implement a basic version that returns public posts with images
    // This can be enhanced later with actual ML/AI models like CLIP or image hashing
    
    const similarPosts = await this.postsRepository
      .createQueryBuilder('post')
      .where('post.visibility = :visibility', { visibility: 'public' })
      .andWhere('post.imageUrls IS NOT NULL')
      .andWhere('array_length(post.imageUrls, 1) > 0')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.reactions', 'reactions')
      .leftJoinAndSelect('post.comments', 'comments')
      .orderBy('post.createdAt', 'DESC')
      .limit(30)
      .getMany();
    
    return similarPosts;
  }
}