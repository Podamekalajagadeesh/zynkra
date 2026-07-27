import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { Article } from '../articles/article.entity';
import { Podcast } from '../podcasts/podcast.entity';
import { Course } from '../courses/course.entity';
import { Group } from '../groups/entities/group.entity';

export interface SearchFilters {
  query: string;
  type?: 'all' | 'posts' | 'users' | 'articles' | 'podcasts' | 'courses' | 'groups';
  dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  sortBy?: 'relevance' | 'recent' | 'popular' | 'engagement';
  tags?: string[];
  language?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  items: any[];
  total: number;
  page: number;
  hasMore: boolean;
  filters: SearchFilters;
  took: number; // ms
}

@Injectable()
export class AdvancedSearchService {
  private readonly logger = new Logger(AdvancedSearchService.name);

  constructor(
    @InjectRepository(Post) private readonly postsRepo: Repository<Post>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Article) private readonly articlesRepo: Repository<Article>,
    @InjectRepository(Podcast) private readonly podcastsRepo: Repository<Podcast>,
    @InjectRepository(Course) private readonly coursesRepo: Repository<Course>,
    @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
  ) {}

  /**
   * Advanced search across all content types.
   */
  async search(filters: SearchFilters): Promise<SearchResult> {
    const startTime = Date.now();
    const { query, type = 'all', page = 1, limit = 20 } = filters;

    if (!query || query.trim().length === 0) {
      return { items: [], total: 0, page, hasMore: false, filters, took: 0 };
    }

    const searchPattern = `%${query.trim()}%`;
    const results: any[] = [];
    let total = 0;

    // Search users
    if (type === 'all' || type === 'users') {
      const users = await this.usersRepo.find({
        where: [{ username: ILike(searchPattern) }, { displayName: ILike(searchPattern) }, { bio: ILike(searchPattern) }],
        take: type === 'all' ? 10 : limit,
      });
      for (const u of users) {
        const text = [u.username, u.displayName, u.bio].filter(Boolean).join(' ');
        results.push({ ...u, _type: 'user', _relevance: this.calculateRelevance(query, text) });
      }
    }

    // Search posts
    if (type === 'all' || type === 'posts') {
      const posts = await this.postsRepo.find({
        where: { content: ILike(searchPattern) },
        relations: ['user'],
        take: type === 'all' ? 10 : limit,
      });
      for (const p of posts) {
        const text = (p as any).content || '';
        results.push({ ...p, _type: 'post', _relevance: this.calculateRelevance(query, text) });
      }
    }

    // Search articles
    if (type === 'all' || type === 'articles') {
      const articles = await this.articlesRepo.find({
        where: [{ title: ILike(searchPattern) }, { content: ILike(searchPattern) }, { excerpt: ILike(searchPattern) }],
        relations: ['author'],
        take: type === 'all' ? 10 : limit,
      });
      for (const a of articles) {
        const text = [a.title, a.content, a.excerpt].filter(Boolean).join(' ');
        results.push({ ...a, _type: 'article', _relevance: this.calculateRelevance(query, text) });
      }
    }

    // Search podcasts
    if (type === 'all' || type === 'podcasts') {
      const podcasts = await this.podcastsRepo.find({
        where: [
          { title: ILike(searchPattern) },
          { description: ILike(searchPattern) },
        ],
        relations: ['author'],
        take: type === 'all' ? 10 : limit,
      });
      results.push(...podcasts.map(p => ({ ...p, _type: 'podcast', _relevance: this.calculateRelevance(query, p.title + ' ' + p.description) })));
    }

    // Search courses
    if (type === 'all' || type === 'courses') {
      const courses = await this.coursesRepo.find({
        where: [
          { title: ILike(searchPattern) },
          { description: ILike(searchPattern) },
        ],
        relations: ['author'],
        take: type === 'all' ? 10 : limit,
      });
      results.push(...courses.map(c => ({ ...c, _type: 'course', _relevance: this.calculateRelevance(query, c.title + ' ' + c.description) })));
    }

    // Search groups
    if (type === 'all' || type === 'groups') {
      const groups = await this.groupsRepo.find({
        where: [
          { name: ILike(searchPattern) },
        ],
        take: type === 'all' ? 10 : limit,
      });
      for (const g of groups) {
        const text = g.name;
        results.push({ ...g, _type: 'group', _relevance: this.calculateRelevance(query, text) });
      }
    }

    // Sort by relevance
    results.sort((a, b) => (b._relevance || 0) - (a._relevance || 0));

    total = results.length;
    const start = (page - 1) * limit;
    const paginated = results.slice(start, start + limit);
    const took = Date.now() - startTime;

    return {
      items: paginated,
      total,
      page,
      hasMore: start + limit < total,
      filters,
      took,
    };
  }

  /**
   * Calculate relevance score based on how well the query matches.
   */
  private calculateRelevance(query: string, text: string): number {
    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();

    // Exact match = highest score
    if (lowerText.includes(lowerQuery)) return 1;

    // Partial match
    const words = lowerQuery.split(' ');
    let matchCount = 0;
    for (const word of words) {
      if (lowerText.includes(word)) matchCount++;
    }
    return matchCount / words.length;
  }

  /**
   * Get trending searches.
   */
  async getTrendingSearches(): Promise<string[]> {
    // In production, this would track popular searches
    return [
      'latest tech news',
      'crypto updates',
      'ai tools',
      'music production',
      'fitness tips',
      'cooking recipes',
      'travel destinations',
      'startup advice',
    ];
  }

  /**
   * Get search suggestions as user types.
   */
  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const searchPattern = `${query}%`;

    const [users, articles] = await Promise.all([
      this.usersRepo.find({
        where: { username: ILike(searchPattern) },
        select: ['username'],
        take: 5,
      }),
      this.articlesRepo.find({
        where: { title: ILike(searchPattern) },
        select: ['title'],
        take: 5,
      }),
    ]);

    const suggestions = [
      ...users.map(u => u.username),
      ...articles.map(a => a.title),
    ];

    return [...new Set(suggestions)].slice(0, 8);
  }

  /**
   * Get search history for a user.
   */
  async getSearchHistory(userId: string): Promise<string[]> {
    // In production, this would query a search_history table
    return [];
  }

  /**
   * Save search to history.
   */
  async saveSearchHistory(userId: string, query: string): Promise<void> {
    // In production, this would insert into search_history table
    this.logger.log(`Search saved: "${query}" by user ${userId}`);
  }
}
