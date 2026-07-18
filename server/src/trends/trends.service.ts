import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Trend } from './entities/trend.entity';
import { User } from '../users/entities/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

interface TrendScoreConfig {
  baseIncrement: number;
  decayRate: number; // Percentage decay per hour
  threshold: number; // Minimum score to remain in database
}

@Injectable()
export class TrendsService {
  private readonly logger = new Logger(TrendsService.name);
  private readonly config: TrendScoreConfig = {
    baseIncrement: 10,
    decayRate: 0.05, // 5% decay per hour
    threshold: 1,
  };

  constructor(
    @InjectRepository(Trend)
    private readonly trendsRepository: Repository<Trend>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async processContent(content: string, contentType: 'post' | 'comment' | 'story', authorWeight: number = 1, location?: string): Promise<void> {
    const hashtags = content.match(/#\w+/g) || [];
    
    if (hashtags.length === 0) return;

    this.logger.debug(`Processing ${hashtags.length} hashtags from ${contentType}${location ? ` at location: ${location}` : ''}`);

    for (const tag of hashtags) {
      const normalizedTag = tag.toLowerCase();
      // Apply content type weights to give more value to posts vs comments
      const contentWeight = contentType === 'post' ? 1 : contentType === 'story' ? 0.7 : 0.3;
      await this.updateTrendScore(normalizedTag, contentWeight * authorWeight, location);
    }
  }

  private async updateTrendScore(tag: string, incrementMultiplier: number = 1, location?: string): Promise<void> {
    // If we have a location, try to find a location-specific trend first
    let trend = location 
      ? await this.trendsRepository.findOne({ where: { tag, location } })
      : await this.trendsRepository.findOne({ where: { tag, location: null } });
    
    const increment = this.config.baseIncrement * incrementMultiplier;
    
    if (trend) {
      // Apply time decay before incrementing
      const hoursSinceLastUpdate = (Date.now() - trend.lastUpdated.getTime()) / (1000 * 60 * 60);
      const decayMultiplier = Math.pow(1 - this.config.decayRate, hoursSinceLastUpdate);
      trend.score = trend.score * decayMultiplier + increment;
      trend.occurrenceCount += 1;
      trend.lastUpdated = new Date();
      
      await this.trendsRepository.save(trend);
    } else {
      trend = this.trendsRepository.create({
        tag,
        score: increment,
        occurrenceCount: 1,
        firstSeen: new Date(),
        lastUpdated: new Date(),
        location: location || null,
      });
      await this.trendsRepository.save(trend);
    }
  }

  async getTrending(limit: number = 10, days: number = 7): Promise<Trend[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.trendsRepository
      .createQueryBuilder('trend')
      .where('trend.lastUpdated >= :cutoff AND trend.location IS NULL', { cutoff: cutoffDate })
      .orderBy('trend.score', 'DESC')
      .take(limit)
      .getMany();
  }

  // Get location-specific trending topics
  async getTrendingByLocation(location: string, limit: number = 10, days: number = 7): Promise<Trend[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.trendsRepository
      .createQueryBuilder('trend')
      .where('trend.lastUpdated >= :cutoff AND trend.location = :location', { 
        cutoff: cutoffDate,
        location: location 
      })
      .orderBy('trend.score', 'DESC')
      .take(limit)
      .getMany();
  }

  // Get personalized trends based on user's followed topics and interests
  async getPersonalizedTrends(userId: string, limit: number = 10): Promise<Trend[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['followedTrends'], // Assume we add this relation to User entity
    });

    if (!user) {
      return this.getTrending(limit, 7);
    }

    // Get trends based on what user has already followed, plus similar popular ones
    const followedTags = user.followedTrends?.map(t => t.tag) || [];
    
    // If user follows nothing, just return global trends
    if (followedTags.length === 0) {
      return this.getTrending(limit, 7);
    }

    // Get global trends first, then prioritize those that match user's interests
    const globalTrends = await this.getTrending(20, 7);
    
    // Boost score for trends similar to what user follows
    const scoredTrends = globalTrends.map(trend => {
      const isFollowed = followedTags.some(tag => trend.tag.includes(tag) || tag.includes(trend.tag));
      return {
        ...trend,
        personalizedScore: isFollowed ? trend.score * 1.5 : trend.score,
      };
    });

    // Sort by personalized score and take limit
    return scoredTrends
      .sort((a, b) => b.personalizedScore - a.personalizedScore)
      .slice(0, limit)
      .map(({ personalizedScore, ...trend }) => trend);
  }

  async getTrendHistory(tag: string, days: number = 30): Promise<Trend | null> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.trendsRepository.findOne({
      where: {
        tag: tag.toLowerCase(),
        lastUpdated: LessThan(cutoffDate),
      },
    });
  }

  async incrementTrendForEvent(tag: string, eventType: 'share' | 'like' | 'comment', authorWeight: number = 1): Promise<void> {
    const eventWeights = {
      share: 1.5,
      like: 0.5,
      comment: 0.7,
    };

    await this.updateTrendScore(tag.toLowerCase(), eventWeights[eventType] * authorWeight);
  }

  // Run cleanup every hour to remove old, low-scoring trends
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldTrends(): Promise<void> {
    this.logger.debug('Running trends cleanup job');
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const result = await this.trendsRepository
      .createQueryBuilder()
      .delete()
      .where('lastUpdated < :oneWeekAgo AND score < :threshold', {
        oneWeekAgo,
        threshold: this.config.threshold,
      })
      .execute();

    this.logger.log(`Removed ${result.affected} old, low-scoring trends`);
  }

  // Extract hashtags from content and update their scores
  async extractAndScoreHashtags(content: string): Promise<void> {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    
    if (!matches) return;

    const uniqueHashtags = [...new Set(matches.map(match => match.slice(1).toLowerCase()))];

    for (const hashtag of uniqueHashtags) {
      await this.trackHashtag(hashtag, 'post');
    }
  }

  // Track a hashtag/topic occurrence
  async trackHashtag(hashtag: string, contentType: string = 'post'): Promise<void> {
    // Use our existing updateTrendScore method which already handles all the logic
    const contentTypeWeights = {
      post: 1,
      comment: 0.5,
      share: 2,
    };
    const weight = contentTypeWeights[contentType] || 1;
    await this.updateTrendScore(hashtag.toLowerCase(), weight);
  }

  // Recalculate scores for all trends (run daily)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async recalculateAllScores(): Promise<void> {
    this.logger.debug('Running daily trend score recalculation');
    
    const allTrends = await this.trendsRepository.find();
    let updatedCount = 0;

    for (const trend of allTrends) {
      const hoursSinceLastUpdate = (Date.now() - trend.lastUpdated.getTime()) / (1000 * 60 * 60);
      const decayMultiplier = Math.pow(1 - this.config.decayRate, hoursSinceLastUpdate);
      const newScore = trend.score * decayMultiplier;
      
      if (newScore < this.config.threshold) {
        await this.trendsRepository.remove(trend);
      } else if (newScore !== trend.score) {
        trend.score = newScore;
        trend.lastUpdated = new Date();
        await this.trendsRepository.save(trend);
        updatedCount++;
      }
    }

    this.logger.log(`Updated scores for ${updatedCount} trends, removed others below threshold`);
  }
}