import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserInterest } from './user-interest.entity';
import { User } from '../users/entities/user.entity';
import { Tag } from '../tags/tag.entity';
import { Post, PostVisibility } from '../posts/entities/post.entity';
import { Product } from '../marketplace/entities/product.entity';

interface InterestScoreConfig {
  baseInteractionScore: Record<string, number>;
  manualAddScore: number;
  decayRate: number; // Daily decay rate
  threshold: number; // Minimum score to retain interest
  maxInterests: number; // Maximum number of interests to track per user
}

export interface RecommendedContent<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UserInterestsService {
  private readonly logger = new Logger(UserInterestsService.name);
  
  private readonly config: InterestScoreConfig = {
    baseInteractionScore: {
      view: 1,
      like: 3,
      comment: 5,
      share: 8,
      save: 10,
      purchase: 15,
    },
    manualAddScore: 20,
    decayRate: 0.02, // 2% decay per day
    threshold: 0.5,
    maxInterests: 50,
  };

  constructor(
    @InjectRepository(UserInterest)
    private readonly userInterestsRepository: Repository<UserInterest>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async recordInteraction(
    user: User,
    tags: Tag[],
    interactionType: 'view' | 'like' | 'comment' | 'share' | 'save' | 'purchase' = 'view',
  ): Promise<void> {
    if (tags.length === 0) return;

    const baseScore = this.config.baseInteractionScore[interactionType];
    
    for (const tag of tags) {
      await this.updateInterestScore(user, tag, baseScore);
    }

    this.logger.debug(`Recorded ${interactionType} interaction for user ${user.id} with ${tags.length} tags`);
  }

  private async updateInterestScore(user: User, tag: Tag, scoreIncrement: number): Promise<void> {
    let interest = await this.userInterestsRepository.findOne({
      where: { user: { id: user.id }, tag: { id: tag.id } },
    });

    if (interest) {
      // Apply time decay before incrementing
      const daysSinceLastInteraction = (Date.now() - interest.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      const decayMultiplier = Math.pow(1 - this.config.decayRate, daysSinceLastInteraction);
      interest.score = interest.score * decayMultiplier + scoreIncrement;
      interest.interactionCount += 1;
      interest.lastUpdated = new Date();
    } else {
      // Check if we need to remove the lowest interest to stay under maxInterests
      const userInterests = await this.userInterestsRepository.find({
        where: { user: { id: user.id } },
        order: { score: 'ASC' },
      });

      if (userInterests.length >= this.config.maxInterests) {
        // Remove the lowest scoring interest
        await this.userInterestsRepository.remove(userInterests[0]);
        this.logger.debug(`Removed lowest interest for user ${user.id} to maintain max limit`);
      }

      interest = this.userInterestsRepository.create({
        user,
        tag,
        score: scoreIncrement,
        interactionCount: 1,
        firstSeen: new Date(),
        lastUpdated: new Date(),
      });
    }

    await this.userInterestsRepository.save(interest);
  }

  async getInterests(user: User, limit: number = 20): Promise<UserInterest[]> {
    return this.userInterestsRepository.find({
      where: { user: { id: user.id } },
      relations: ['tag'],
      order: { score: 'DESC' },
      take: limit,
    });
  }

  async addInterest(user: User, tagId: string): Promise<UserInterest> {
    const tag = await this.tagsRepository.findOne({ where: { id: tagId } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    let interest = await this.userInterestsRepository.findOne({
      where: { user: { id: user.id }, tag: { id: tagId } },
    });

    if (interest) {
      interest.score += this.config.manualAddScore;
      interest.lastUpdated = new Date();
    } else {
      interest = this.userInterestsRepository.create({
        user,
        tag,
        score: this.config.manualAddScore,
        interactionCount: 1,
        firstSeen: new Date(),
        lastUpdated: new Date(),
      });
    }

    await this.userInterestsRepository.save(interest);
    this.logger.log(`User ${user.id} manually added interest in tag ${tag.name}`);
    
    return interest;
  }

  async removeInterest(user: User, tagId: string): Promise<void> {
    const result = await this.userInterestsRepository.delete({
      user: { id: user.id },
      tag: { id: tagId },
    });

    if (result.affected === 0) {
      throw new NotFoundException('Interest not found');
    }

    this.logger.log(`User ${user.id} removed interest in tag ${tagId}`);
  }

  async getRecommendedPosts(
    user: User,
    page: number = 1,
    limit: number = 20,
  ): Promise<RecommendedContent<Post>> {
    const skip = (page - 1) * limit;
    const interests = await this.getInterests(user, 15);
    
    if (interests.length === 0) {
      // Return popular/trending posts if user has no interests
      const [posts, total] = await this.postsRepository.findAndCount({
        relations: ['user', 'tags'],
        where: { visibility: PostVisibility.PUBLIC },
        order: { viewCount: 'DESC', createdAt: 'DESC' },
        skip,
        take: limit,
      });

      return {
        data: posts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Calculate tag weights based on user's interest scores
    const tagWeights = new Map<string, number>();
    let totalScore = 0;
    interests.forEach(interest => {
      tagWeights.set(interest.tag.id, interest.score);
      totalScore += interest.score;
    });

    // Get posts that match user's interests with relevance scoring
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.tags', 'tags')
      .where('post.visibility = :visibility', { visibility: 'public' })
      .andWhere('post.userId != :userId', { userId: user.id })
      .andWhere('tags.id IN (:...tagIds)', { tagIds: Array.from(tagWeights.keys()) });

    const [posts, total] = await queryBuilder
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('post.viewCount', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Sort posts by relevance (number of matching tags and their weights)
    const scoredPosts = posts.map(post => {
      let relevanceScore = 0;
      post.tags.forEach(tag => {
        const weight = tagWeights.get(tag.id) || 0;
        relevanceScore += weight;
      });
      return { post, relevanceScore };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      data: scoredPosts.map(sp => sp.post),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRecommendedProducts(
    user: User,
    page: number = 1,
    limit: number = 20,
  ): Promise<RecommendedContent<Product>> {
    const skip = (page - 1) * limit;
    const interests = await this.getInterests(user, 15);
    
    if (interests.length === 0) {
      // Return popular products if user has no interests
      const [products, total] = await this.productsRepository.findAndCount({
        relations: ['seller', 'variants'],
        where: { isActive: true },
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      return {
        data: products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Get user's top categories from interests
    const tagNames = interests.map(i => i.tag.name.toLowerCase());

    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.sellerId != :userId', { userId: user.id });

    // Add category matching
    if (tagNames.length > 0) {
      const categoryConditions = tagNames.map((name, index) => 
        `(product.categories LIKE :category${index})`
      ).join(' OR ');
      
      const categoryParams = tagNames.reduce((acc, name, index) => {
        acc[`category${index}`] = `%${name}%`;
        return acc;
      }, {});

      queryBuilder.andWhere(`(${categoryConditions})`, categoryParams);
    }

    const [products, total] = await queryBuilder
      .orderBy('product.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserSimilarInterests(user: User, limit: number = 10): Promise<Tag[]> {
    // Find users with similar interests to this user
    const userInterests = await this.getInterests(user, 10);
    if (userInterests.length === 0) return [];

    const userTagIds = userInterests.map(i => i.tag.id);

    // Find other users who share these interests
    const similarUsersInterests = await this.userInterestsRepository
      .createQueryBuilder('userInterest')
      .leftJoinAndSelect('userInterest.tag', 'tag')
      .where('userInterest.tag.id IN (:...tagIds)', { tagIds: userTagIds })
      .andWhere('userInterest.userId != :userId', { userId: user.id })
      .getMany();

    // Count tag occurrences to find related interests
    const tagCounts = new Map<string, number>();
    similarUsersInterests.forEach(interest => {
      if (!userTagIds.includes(interest.tag.id)) {
        const current = tagCounts.get(interest.tag.id) || 0;
        tagCounts.set(interest.tag.id, current + interest.score);
      }
    });

    // Sort by count and return top tags
    const sortedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return this.tagsRepository.findByIds(sortedTags.map(([id]) => id));
  }

  // Daily cleanup of old, low-scoring interests
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldInterests(): Promise<void> {
    this.logger.debug('Running user interests cleanup job');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.userInterestsRepository
      .createQueryBuilder()
      .delete()
      .where('lastUpdated < :thirtyDaysAgo AND score < :threshold', {
        thirtyDaysAgo,
        threshold: this.config.threshold,
      })
      .execute();

    this.logger.log(`Removed ${result.affected} old, low-scoring user interests`);
  }

  // Recalculate scores for all interests (run weekly)
  @Cron(CronExpression.EVERY_WEEK)
  async recalculateAllInterestScores(): Promise<void> {
    this.logger.debug('Running weekly interest score recalculation');
    
    const allInterests = await this.userInterestsRepository.find();
    let updatedCount = 0;

    for (const interest of allInterests) {
      const daysSinceLastUpdate = (Date.now() - interest.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      const decayMultiplier = Math.pow(1 - this.config.decayRate, daysSinceLastUpdate);
      const newScore = interest.score * decayMultiplier;
      
      if (newScore < this.config.threshold) {
        await this.userInterestsRepository.remove(interest);
      } else if (newScore !== interest.score) {
        interest.score = newScore;
        interest.lastUpdated = new Date();
        await this.userInterestsRepository.save(interest);
        updatedCount++;
      }
    }

    this.logger.log(`Updated scores for ${updatedCount} user interests, removed others below threshold`);
  }
}