/**
 * Postgres full-text search (websearch_to_tsquery + ts_rank over searchVector).
 * Fallback ILIKE covers partial/prefix matches that tsquery misses (e.g. "alex" → "alexander").
 */
import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Tag } from '../tags/tag.entity';
import { Place } from '../places/entities/place.entity';
import { Event } from '../events/entities/event.entity';
import { Group } from '../groups/entities/group.entity';
import { Product } from '../marketplace/entities/product.entity';
import { VisibilityService } from '../common/visibility/visibility.service';

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
    private readonly visibilityService: VisibilityService
  ) {}

  private normalize(query: string): string {
    const q = query?.trim();
    if (!q) {
      throw new BadRequestException('Search query is required');
    }
    return q;
  }

  private rank(alias: string): string {
    return `ts_rank(${alias}."searchVector", websearch_to_tsquery('simple', :ftsQuery))`;
  }

  /**
   * Full-text search across users, posts, hashtags, places, groups, events, products.
   */
  async search(query: string, viewerId?: string) {
    const q = this.normalize(query);
    const pattern = `%${q}%`;

    const users = await this.usersRepository
      .createQueryBuilder('user')
      .where(
        new Brackets((nameQuery) => {
          nameQuery
            .where('user."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
            .orWhere('user.username ILIKE :pattern')
            .orWhere('user."displayName" ILIKE :pattern');
        })
      )
      .andWhere(
        `(
          user.id = :viewerId OR user."searchVisibility" = 'everyone' OR
          (user."searchVisibility" = 'friends' AND EXISTS (
            SELECT 1 FROM follows f1
            WHERE f1."followerId" = :viewerId AND f1."followingId" = user.id
          ) AND EXISTS (
            SELECT 1 FROM follows f2
            WHERE f2."followerId" = user.id AND f2."followingId" = :viewerId
          ))
        )`,
        { viewerId: viewerId ?? null }
      )
      .orderBy(this.rank('user'), 'DESC')
      .setParameter('ftsQuery', q)
      .setParameter('pattern', pattern)
      .limit(MAX_RESULTS)
      .getMany();

    let posts = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where(
        new Brackets((contentQuery) => {
          contentQuery
            .where('post."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
            .orWhere('post.content ILIKE :pattern');
        })
      )
      .orderBy(this.rank('post'), 'DESC')
      .addOrderBy('post."createdAt"', 'DESC')
      .setParameter('ftsQuery', q)
      .setParameter('pattern', pattern)
      .limit(MAX_RESULTS)
      .getMany();
    posts = await this.visibilityService.filterVisiblePostsForViewer(viewerId ?? null, posts);

    const hashtags = await Promise.all(
      (
        await this.tagsRepository
          .createQueryBuilder('tag')
          .where(
            new Brackets((tagQuery) => {
              tagQuery
                .where('tag."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
                .orWhere('tag.name ILIKE :pattern');
            })
          )
          .orderBy(this.rank('tag'), 'DESC')
          .setParameter('ftsQuery', q)
          .setParameter('pattern', pattern)
          .limit(MAX_RESULTS)
          .getMany()
      ).map(async (tag) => {
        const countRow: { count: number }[] = await this.tagsRepository.query(
          `SELECT COUNT(*)::int AS count FROM post_tags pt WHERE pt."tag_id" = $1`,
          [tag.id]
        );
        return { ...tag, postCount: countRow[0]?.count ?? 0 };
      })
    );

    const places = await this.placesRepository
      .createQueryBuilder('place')
      .where(
        new Brackets((placeQuery) => {
          placeQuery
            .where('place."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
            .orWhere('place.name ILIKE :pattern')
            .orWhere('place.address ILIKE :pattern');
        })
      )
      .orderBy(this.rank('place'), 'DESC')
      .setParameter('ftsQuery', q)
      .setParameter('pattern', pattern)
      .limit(MAX_RESULTS)
      .getMany();

    const groups = await Promise.all(
      (
        await this.groupsRepository
          .createQueryBuilder('group')
          .where(
            new Brackets((groupQuery) => {
              groupQuery
                .where('group."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
                .orWhere('group.name ILIKE :pattern');
            })
          )
          .orderBy(this.rank('group'), 'DESC')
          .setParameter('ftsQuery', q)
          .setParameter('pattern', pattern)
          .limit(MAX_RESULTS)
          .getMany()
      ).map(async (group) => {
        const countRow: { count: number }[] = await this.groupsRepository.query(
          `SELECT COUNT(*)::int AS count FROM group_members gm WHERE gm."groupId" = $1`,
          [group.id]
        );
        return { ...group, memberCount: countRow[0]?.count ?? 0 };
      })
    );

    const events = await this.eventsRepository
      .createQueryBuilder('event')
      .where(
        new Brackets((eventQuery) => {
          eventQuery
            .where('event."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
            .orWhere('event.title ILIKE :pattern')
            .orWhere('event.description ILIKE :pattern');
        })
      )
      .orderBy(this.rank('event'), 'DESC')
      .setParameter('ftsQuery', q)
      .setParameter('pattern', pattern)
      .limit(MAX_RESULTS)
      .getMany();

    const products = await this.productsRepository
      .createQueryBuilder('product')
      .where(
        new Brackets((productQuery) => {
          productQuery
            .where('product."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
            .orWhere('product.name ILIKE :pattern')
            .orWhere('product.description ILIKE :pattern');
        })
      )
      .orderBy(this.rank('product'), 'DESC')
      .setParameter('ftsQuery', q)
      .setParameter('pattern', pattern)
      .limit(MAX_RESULTS)
      .getMany();

    return { users, posts, hashtags, places, groups, events, products };
  }

  /**
   * Advanced search with filters and sorting
   */
  async advancedSearch(params: {
    query: string;
    type?: 'users' | 'posts' | 'hashtags' | 'places' | 'groups' | 'events' | 'products';
    sort?: 'relevance' | 'date' | 'popularity';
    limit?: number;
    offset?: number;
    viewerId?: string;
  }) {
    const { query, type, sort = 'relevance', limit = 20, offset = 0, viewerId } = params;
    this.normalize(query);

    if (type) {
      switch (type) {
        case 'users':
          return this.searchUsers(query.trim(), viewerId, limit, offset);
        case 'posts':
          return this.searchPosts(query.trim(), viewerId, limit, offset, sort);
        case 'hashtags':
          return this.searchHashtags(query.trim(), limit, offset);
        case 'places':
          return this.searchPlaces(query.trim(), limit, offset);
        case 'groups':
          return this.searchGroups(query.trim(), limit, offset);
        case 'events':
          return this.searchEvents(query.trim(), limit, offset);
        case 'products':
          return this.searchProducts(query.trim(), limit, offset);
        default:
          throw new BadRequestException(`Invalid search type: ${type}`);
      }
    }

    return this.search(query, viewerId);
  }

  private async searchUsers(q: string, viewerId?: string, limit = 20, offset = 0) {
    const pattern = `%${q}%`;
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .where(
        new Brackets((nameQuery) => {
          nameQuery
            .where('user."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
            .orWhere('user.username ILIKE :pattern')
            .orWhere('user."displayName" ILIKE :pattern');
        })
      )
      .andWhere(
        `(
          user.id = :viewerId OR user."searchVisibility" = 'everyone' OR
          (user."searchVisibility" = 'friends' AND EXISTS (
            SELECT 1 FROM follows f1
            WHERE f1."followerId" = :viewerId AND f1."followingId" = user.id
          ) AND EXISTS (
            SELECT 1 FROM follows f2
            WHERE f2."followerId" = user.id AND f2."followingId" = :viewerId
          ))
        )`,
        { viewerId: viewerId ?? null }
      )
      .orderBy(this.rank('user'), 'DESC')
      .setParameter('ftsQuery', q)
      .setParameter('pattern', pattern)
      .limit(limit)
      .offset(offset)
      .getMany();

    return { users, total: users.length };
  }

  private async searchPosts(q: string, viewerId?: string, limit = 20, offset = 0, sort = 'date') {
    const pattern = `%${q}%`;
    const query = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where(
        new Brackets((contentQuery) => {
          contentQuery
            .where('post."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
            .orWhere('post.content ILIKE :pattern');
        })
      )
      .setParameter('ftsQuery', q)
      .setParameter('pattern', pattern);

    if (sort === 'popularity') {
      query.orderBy('post."repostCount"', 'DESC').addOrderBy('post."createdAt"', 'DESC');
    } else {
      query.orderBy(this.rank('post'), 'DESC').addOrderBy('post."createdAt"', 'DESC');
    }

    const posts = await query.limit(limit).offset(offset).getMany();

    const filteredPosts = await this.visibilityService.filterVisiblePostsForViewer(
      viewerId ?? null,
      posts
    );

    return { posts: filteredPosts, total: filteredPosts.length };
  }

  private async searchHashtags(q: string, limit = 20, offset = 0) {
    const pattern = `%${q}%`;
    const rows = await this.tagsRepository
      .createQueryBuilder('tag')
      .where(
        new Brackets((tagQuery) => {
          tagQuery
            .where('tag."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
            .orWhere('tag.name ILIKE :pattern');
        })
      )
      .orderBy(this.rank('tag'), 'DESC')
      .setParameter('ftsQuery', q)
      .setParameter('pattern', pattern)
      .limit(limit)
      .offset(offset)
      .getMany();

    const hashtags = await Promise.all(
      rows.map(async (tag) => {
        const countRow: { count: number }[] = await this.tagsRepository.query(
          `SELECT COUNT(*)::int AS count FROM post_tags pt WHERE pt."tag_id" = $1`,
          [tag.id]
        );
        return { ...tag, postCount: countRow[0]?.count ?? 0 };
      })
    );

    return { hashtags, total: hashtags.length };
  }

  private async searchPlaces(q: string, limit = 20, offset = 0) {
    const pattern = `%${q}%`;
    const places = await this.placesRepository
      .createQueryBuilder('place')
      .where(
        new Brackets((placeQuery) => {
          placeQuery
            .where('place."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
            .orWhere('place.name ILIKE :pattern')
            .orWhere('place.address ILIKE :pattern');
        })
      )
      .orderBy(this.rank('place'), 'DESC')
      .setParameter('ftsQuery', q)
      .setParameter('pattern', pattern)
      .limit(limit)
      .offset(offset)
      .getMany();

    return { places, total: places.length };
  }

  private async searchGroups(q: string, limit = 20, offset = 0) {
    const pattern = `%${q}%`;
    const rows = await this.groupsRepository
      .createQueryBuilder('group')
      .where(
        new Brackets((groupQuery) => {
          groupQuery
            .where('group."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
            .orWhere('group.name ILIKE :pattern');
        })
      )
      .orderBy(this.rank('group'), 'DESC')
      .setParameter('ftsQuery', q)
      .setParameter('pattern', pattern)
      .limit(limit)
      .offset(offset)
      .getMany();

    const groups = await Promise.all(
      rows.map(async (group) => {
        const countRow: { count: number }[] = await this.groupsRepository.query(
          `SELECT COUNT(*)::int AS count FROM group_members gm WHERE gm."groupId" = $1`,
          [group.id]
        );
        return { ...group, memberCount: countRow[0]?.count ?? 0 };
      })
    );

    return { groups, total: groups.length };
  }

  private async searchEvents(q: string, limit = 20, offset = 0) {
    const pattern = `%${q}%`;
    const events = await this.eventsRepository
      .createQueryBuilder('event')
      .where(
        new Brackets((eventQuery) => {
          eventQuery
            .where('event."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
            .orWhere('event.title ILIKE :pattern')
            .orWhere('event.description ILIKE :pattern');
        })
      )
      .orderBy('event.date', 'ASC')
      .setParameter('ftsQuery', q)
      .setParameter('pattern', pattern)
      .limit(limit)
      .offset(offset)
      .getMany();

    return { events, total: events.length };
  }

  private async searchProducts(q: string, limit = 20, offset = 0) {
    const pattern = `%${q}%`;
    const products = await this.productsRepository
      .createQueryBuilder('product')
      .where(
        new Brackets((productQuery) => {
          productQuery
            .where('product."searchVector" @@ websearch_to_tsquery(\'simple\', :ftsQuery)')
            .orWhere('product.name ILIKE :pattern')
            .orWhere('product.description ILIKE :pattern');
        })
      )
      .orderBy(this.rank('product'), 'DESC')
      .addOrderBy('product."createdAt"', 'DESC')
      .setParameter('ftsQuery', q)
      .setParameter('pattern', pattern)
      .limit(limit)
      .offset(offset)
      .getMany();

    return { products, total: products.length };
  }

  async followUpSearch(previousQuery: string, followUpQuery: string, viewerId?: string) {
    const previous = previousQuery?.trim();
    const followUp = followUpQuery?.trim();
    if (!previous || !followUp) {
      throw new BadRequestException('Previous and follow-up search queries are required');
    }

    const query = `${previous} ${followUp}`;
    return {
      ...(await this.search(query, viewerId)),
      previousQuery: previous,
      followUpQuery: followUp,
      query,
    };
  }

  /**
   * Reverse image search (Preview): returns recent public posts with images.
   * True perceptual/ML image matching is not implemented — this path only
   * surfaces image-bearing posts so the UI has something honest to show.
   */
  async reverseImageSearch(_image?: Express.Multer.File) {
    return this.postsRepository
      .createQueryBuilder('post')
      .innerJoin('post.media', 'media')
      .where('post.visibility = :visibility', { visibility: 'public' })
      .andWhere('media.type = :mediaType', { mediaType: 'image' })
      .leftJoinAndSelect('post.user', 'user')
      .orderBy('post."createdAt"', 'DESC')
      .limit(MAX_RESULTS)
      .getMany();
  }

  async imageTextSearch(query: string, image?: Express.Multer.File) {
    const textResults = query?.trim()
      ? await this.search(query.trim())
      : {
          users: [],
          posts: [],
          hashtags: [],
          places: [],
          groups: [],
          events: [],
          products: [],
        };

    return {
      ...textResults,
      imageSearchResults: await this.reverseImageSearch(image),
      query: query?.trim() ?? '',
      imageProvided: Boolean(image),
      note: image
        ? 'Reverse image matching is Preview — showing recent public image posts instead of perceptual matches.'
        : undefined,
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
            ? [
                {
                  title: data.Heading || normalizedQuery,
                  snippet: data.AbstractText,
                  url: data.AbstractURL,
                },
              ]
            : []),
          ...relatedTopics,
        ].slice(0, MAX_RESULTS),
      };
    } catch {
      throw new ServiceUnavailableException('Web search is temporarily unavailable');
    }
  }
}
