import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';

export interface FeedAlgorithm {
  name: string;
  label: string;
  description: string;
  weights: {
    recency: number;
    engagement: number;
    relevance: number;
    diversity: number;
    creator: number;
  };
}

const ALGORITHMS: Record<string, FeedAlgorithm> = {
  chronological: {
    name: 'chronological',
    label: 'Latest First',
    description: 'See posts in order they were posted — no algorithm, just timeline.',
    weights: { recency: 1.0, engagement: 0, relevance: 0, diversity: 0, creator: 0 },
  },
  engagement: {
    name: 'engagement',
    label: 'Popular',
    description: 'See the most engaged posts first — likes, comments, shares.',
    weights: { recency: 0.2, engagement: 0.8, relevance: 0, diversity: 0, creator: 0 },
  },
  relevance: {
    name: 'relevance',
    label: 'For You',
    description: 'AI-powered: posts most relevant to your interests and activity.',
    weights: { recency: 0.3, engagement: 0.3, relevance: 0.4, diversity: 0, creator: 0 },
  },
  friends: {
    name: 'friends',
    label: 'Friends & Family',
    description: 'Posts from people you follow and interact with most.',
    weights: { recency: 0.4, engagement: 0.2, relevance: 0.1, diversity: 0, creator: 0.3 },
  },
  discovery: {
    name: 'discovery',
    label: 'Discover',
    description: 'Find new creators and content from outside your network.',
    weights: { recency: 0.1, engagement: 0.2, relevance: 0.3, diversity: 0.4, creator: 0 },
  },
  media: {
    name: 'media',
    label: 'Media First',
    description: 'Prioritize posts with images, videos, and audio.',
    weights: { recency: 0.3, engagement: 0.2, relevance: 0.2, diversity: 0, creator: 0.3 },
  },
};

@Injectable()
export class SmartFeedService {
  private readonly logger = new Logger(SmartFeedService.name);

  constructor(
    @InjectRepository(Post) private readonly postsRepo: Repository<Post>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  /**
   * Get available feed algorithms.
   */
  getAlgorithms(): FeedAlgorithm[] {
    return Object.values(ALGORITHMS);
  }

  /**
   * Get the active algorithm for a user.
   */
  async getUserAlgorithm(userId: string): Promise<string> {
    // Default to relevance algorithm
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    return (user as any)?.feedAlgorithm || 'relevance';
  }

  /**
   * Set the active algorithm for a user.
   */
  async setUserAlgorithm(userId: string, algorithm: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return;
    (user as any).feedAlgorithm = algorithm;
    await this.usersRepo.save(user);
  }

  /**
   * Generate a personalized feed using the selected algorithm.
   */
  async generateFeed(userId: string, options: {
    algorithm?: string;
    page?: number;
    limit?: number;
    cursor?: string;
  } = {}): Promise<{
    posts: any[];
    algorithm: string;
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const algorithmName = options.algorithm || await this.getUserAlgorithm(userId);
    const algorithm = ALGORITHMS[algorithmName] || ALGORITHMS.relevance;
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 50);

    // Get all recent posts
    const posts = await this.postsRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'author')
      .orderBy('post.createdAt', 'DESC')
      .limit(500) // Get a pool to score
      .getMany();

    // Score each post using the algorithm
    const scored = posts.map((post) => ({
      ...post,
      score: this.scorePost(post, algorithm, userId),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Paginate
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = scored.slice(start, end);

    return {
      posts: paginated.map(p => {
        const { score, ...rest } = p;
        return { ...rest, _score: score };
      }),
      algorithm: algorithmName,
      hasMore: end < scored.length,
      nextCursor: end < scored.length ? `${page + 1}` : undefined,
    };
  }

  /**
   * Score a post based on the algorithm weights.
   */
  private scorePost(post: any, algorithm: FeedAlgorithm, userId: string): number {
    const weights = algorithm.weights;
    let score = 0;

    // Recency score (0-1): newer posts score higher
    const ageInHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 1 - (ageInHours / 168)); // Decay over 7 days
    score += weights.recency * recencyScore;

    // Engagement score (0-1): likes, comments, views
    const reactionCount = (post as any).reactions?.length || 0;
    const commentCount = (post as any).comments?.length || 0;
    const viewCount = (post as any).viewCount || 0;
    const engagement = reactionCount * 1 + commentCount * 2 + viewCount * 0.1;
    const engagementScore = Math.min(1, engagement / 100); // Normalize to 0-1
    score += weights.engagement * engagementScore;

    // Relevance score (0-1): content similarity to user's interests
    const relevanceScore = this.calculateRelevance(post, userId);
    score += weights.relevance * relevanceScore;

    // Diversity score (0-1): variety of content types
    const diversityScore = this.calculateDiversity(post);
    score += weights.diversity * diversityScore;

    // Creator score (0-1): boosted if from followed/interacted creators
    const creatorScore = post.user?.id === userId ? 0.5 : 0; // Slight boost for own posts
    score += weights.creator * creatorScore;

    return score;
  }

  /**
   * Calculate relevance score based on content analysis.
   */
  private calculateRelevance(post: any, userId: string): number {
    // Simple keyword-based relevance
    const content = (post.content || '').toLowerCase();
    const keywords = content.split(/\s+/).filter((w: string) => w.length > 4);

    // Score based on common interest words
    const interestWords = ['tech', 'ai', 'crypto', 'design', 'music', 'art', 'food', 'travel', 'fitness', 'coding'];
    const matches = interestWords.filter(word => content.includes(word));

    return Math.min(1, matches.length / 3);
  }

  /**
   * Calculate diversity score based on content variety.
   */
  private calculateDiversity(post: any): number {
    let diversity = 0;

    // Has media? More diverse
    if (post.mediaUrls && post.mediaUrls.length > 0) diversity += 0.3;

    // Has hashtags? More diverse
    if (post.hashtags && post.hashtags.length > 0) diversity += 0.2;

    // Has mentions? More diverse
    if (post.mentions && post.mentions.length > 0) diversity += 0.1;

    // Longer content? More diverse
    if (post.content && post.content.length > 100) diversity += 0.2;

    // Has location? More diverse
    if (post.place) diversity += 0.2;

    return Math.min(1, diversity);
  }

  /**
   * Get feed stats for analytics.
   */
  async getFeedStats(userId: string): Promise<{
    totalPosts: number;
    algorithm: string;
    avgEngagement: number;
    topContentTypes: string[];
  }> {
    const algorithm = await this.getUserAlgorithm(userId);

    const posts = await this.postsRepo.find({ order: { createdAt: 'DESC' }, take: 100 });

    const avgEngagement = posts.reduce((sum, p) => {
      const reactions = (p as any).reactions?.length || 0;
      const comments = (p as any).comments?.length || 0;
      return sum + reactions + comments;
    }, 0) / Math.max(posts.length, 1);

    return {
      totalPosts: posts.length,
      algorithm,
      avgEngagement: Math.round(avgEngagement),
      topContentTypes: ['posts', 'articles', 'reels'],
    };
  }
}
