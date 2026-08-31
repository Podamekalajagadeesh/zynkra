import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
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

  async followUpSearch(previousQuery: string, followUpQuery: string) {
    const previous = previousQuery?.trim();
    const followUp = followUpQuery?.trim();
    if (!previous || !followUp) {
      throw new BadRequestException('Previous and follow-up search queries are required');
    }

    const query = `${previous} ${followUp}`;
    return {
      ...(await this.search(query)),
      previousQuery: previous,
      followUpQuery: followUp,
      query,
    };
  }

  async reverseImageSearch(_image?: Express.Multer.File) {
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

  async imageTextSearch(query: string, image?: Express.Multer.File) {
    const textResults = query?.trim() ? await this.search(query.trim()) : {
      users: [], posts: [], hashtags: [], places: [], groups: [], events: [], products: [],
    };

    return {
      ...textResults,
      imageSearchResults: await this.reverseImageSearch(image),
      query: query?.trim() ?? '',
      imageProvided: Boolean(image),
    };
  }

  async webConnectedSearch(query: string) {
    const normalizedQuery = query?.trim();
    if (!normalizedQuery) {
      throw new BadRequestException('Search query is required');
    }

    try {
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: { q: normalizedQuery, format: 'json', no_html: 1, skip_disambig: 1 },
        timeout: 5000,
      });
      const data = response.data ?? {};
      const relatedTopics = (data.RelatedTopics ?? [])
        .filter((topic: any) => topic.Text && topic.FirstURL)
        .slice(0, MAX_RESULTS)
        .map((topic: any) => ({ title: topic.Text, url: topic.FirstURL }));

      return {
        query: normalizedQuery,
        results: [
          ...(data.AbstractText && data.AbstractURL
            ? [{ title: data.Heading || normalizedQuery, snippet: data.AbstractText, url: data.AbstractURL }]
            : []),
          ...relatedTopics,
        ].slice(0, MAX_RESULTS),
      };
    } catch {
      throw new ServiceUnavailableException('Web search is temporarily unavailable');
    }
  }
}