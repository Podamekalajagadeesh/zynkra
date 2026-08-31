import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TrustIndicator, TrustLevel } from './entities/trust-indicator.entity';
import { Post } from '../../posts/entities/post.entity';

@Injectable()
export class TrustIndicatorService {
  private readonly logger = new Logger(TrustIndicatorService.name);

  constructor(
    @InjectRepository(TrustIndicator)
    private trustIndicatorRepository: Repository<TrustIndicator>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async getOrCreateTrustIndicator(userId: string): Promise<TrustIndicator> {
    let indicator = await this.trustIndicatorRepository.findOne({ where: { user: { id: userId } } });

    if (!indicator) {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      indicator = this.trustIndicatorRepository.create({
        user,
        userId,
        trustLevel: TrustLevel.UNKNOWN,
        trustScore: 0,
        verificationCount: 0,
        badgeCount: 0,
        isVerified: false,
        hasCompletedIdentityVerification: false,
        hasCompletedAgeVerification: false,
        accountAgeInDays: 0,
        postCount: 0,
        followerCount: 0,
        hasProfilePhoto: false,
        hasCompletedProfile: false,
        reportCount: 0,
        isBanned: false,
      });

      indicator = await this.trustIndicatorRepository.save(indicator);
    }

    return indicator;
  }

  async updateTrustScore(userId: string): Promise<TrustIndicator> {
    const indicator = await this.getOrCreateTrustIndicator(userId);
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let trustScore = 0;

    // Verified identity
    if (user.verified) {
      trustScore += 25;
      indicator.hasCompletedIdentityVerification = true;
    }

    // Age verified
    if (user.birthDateVerifiedAt) {
      trustScore += 15;
      indicator.hasCompletedAgeVerification = true;
    }

    // Has profile photo
    if (user.avatar) {
      trustScore += 10;
      indicator.hasProfilePhoto = true;
    }

    // Has completed profile
    if (user.displayName && user.bio) {
      trustScore += 10;
      indicator.hasCompletedProfile = true;
    }

    // Account age
    const createdAt = new Date(user.createdAt);
    const accountAgeInDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    indicator.accountAgeInDays = accountAgeInDays;

    if (accountAgeInDays > 365) trustScore += 20;
    else if (accountAgeInDays > 180) trustScore += 15;
    else if (accountAgeInDays > 90) trustScore += 10;
    else if (accountAgeInDays > 30) trustScore += 5;

    // Post activity
    const postCount = await this.postsRepository.count({ where: { user: { id: userId } } });
    indicator.postCount = postCount;

    if (postCount > 100) trustScore += 15;
    else if (postCount > 50) trustScore += 10;
    else if (postCount > 10) trustScore += 5;

    // Not banned
    if (!user.banned) {
      trustScore += 20;
      indicator.isBanned = false;
    } else {
      indicator.isBanned = true;
      trustScore = 0; // Reset trust score if banned
    }

    // Set trust level
    indicator.trustScore = Math.min(trustScore, 100);
    indicator.isVerified = user.verified;

    if (trustScore >= 80) {
      indicator.trustLevel = TrustLevel.VERIFIED;
    } else if (trustScore >= 60) {
      indicator.trustLevel = TrustLevel.HIGH;
    } else if (trustScore >= 40) {
      indicator.trustLevel = TrustLevel.MEDIUM;
    } else if (trustScore > 0) {
      indicator.trustLevel = TrustLevel.LOW;
    } else {
      indicator.trustLevel = TrustLevel.UNKNOWN;
    }

    indicator.updatedAt = new Date();

    const saved = await this.trustIndicatorRepository.save(indicator);
    this.logger.log(`Trust score updated for user ${userId}: ${saved.trustScore}`);

    return saved;
  }

  async getTrustIndicator(userId: string): Promise<TrustIndicator> {
    return this.getOrCreateTrustIndicator(userId);
  }

  async getTrustLevel(userId: string): Promise<TrustLevel> {
    const indicator = await this.getTrustIndicator(userId);
    return indicator.trustLevel;
  }

  async getTrustScore(userId: string): Promise<number> {
    const indicator = await this.getTrustIndicator(userId);
    return indicator.trustScore;
  }

  async incrementVerificationCount(userId: string): Promise<void> {
    const indicator = await this.getOrCreateTrustIndicator(userId);
    indicator.verificationCount += 1;
    await this.trustIndicatorRepository.save(indicator);
  }

  async incrementBadgeCount(userId: string): Promise<void> {
    const indicator = await this.getOrCreateTrustIndicator(userId);
    indicator.badgeCount += 1;
    await this.trustIndicatorRepository.save(indicator);
  }

  async decrementBadgeCount(userId: string): Promise<void> {
    const indicator = await this.getOrCreateTrustIndicator(userId);
    if (indicator.badgeCount > 0) {
      indicator.badgeCount -= 1;
      await this.trustIndicatorRepository.save(indicator);
    }
  }

  async addBadge(userId: string, badgeType: string): Promise<TrustIndicator> {
    const indicator = await this.getOrCreateTrustIndicator(userId);

    if (!indicator.badges) {
      indicator.badges = [];
    }

    if (!indicator.badges.includes(badgeType)) {
      indicator.badges.push(badgeType);
    }

    await this.incrementBadgeCount(userId);
    return this.trustIndicatorRepository.save(indicator);
  }

  async removeBadge(userId: string, badgeType: string): Promise<TrustIndicator> {
    const indicator = await this.getOrCreateTrustIndicator(userId);

    if (indicator.badges) {
      indicator.badges = indicator.badges.filter(b => b !== badgeType);
    }

    await this.decrementBadgeCount(userId);
    return this.trustIndicatorRepository.save(indicator);
  }

  async recordReport(userId: string): Promise<void> {
    const indicator = await this.getOrCreateTrustIndicator(userId);
    indicator.reportCount += 1;

    // Reduce trust score
    if (indicator.trustScore > 0) {
      indicator.trustScore = Math.max(0, indicator.trustScore - 10);
    }

    await this.trustIndicatorRepository.save(indicator);
    await this.updateTrustScore(userId);
  }

  async addNote(userId: string, note: string): Promise<TrustIndicator> {
    const indicator = await this.getOrCreateTrustIndicator(userId);
    indicator.notes = note;
    return this.trustIndicatorRepository.save(indicator);
  }

  async getUsersByTrustLevel(trustLevel: TrustLevel, limit: number = 50): Promise<TrustIndicator[]> {
    return this.trustIndicatorRepository.find({
      where: { trustLevel },
      order: { trustScore: 'DESC' },
      take: limit,
    });
  }

  async getUsersByTrustScore(minScore: number = 0, maxScore: number = 100, limit: number = 50): Promise<TrustIndicator[]> {
    return this.trustIndicatorRepository
      .createQueryBuilder('indicator')
      .where('indicator.trustScore >= :minScore', { minScore })
      .andWhere('indicator.trustScore <= :maxScore', { maxScore })
      .orderBy('indicator.trustScore', 'DESC')
      .take(limit)
      .getMany();
  }

  async getTopTrustedUsers(limit: number = 50): Promise<TrustIndicator[]> {
    return this.trustIndicatorRepository.find({
      order: { trustScore: 'DESC', updatedAt: 'DESC' },
      take: limit,
    });
  }

  async getTrustStats(): Promise<{
    totalUsers: number;
    averageTrustScore: number;
    verifiedCount: number;
    bannedCount: number;
    trustDistribution: Record<string, number>;
  }> {
    const all = await this.trustIndicatorRepository.find();

    const trustDistribution = {
      [TrustLevel.UNKNOWN]: 0,
      [TrustLevel.LOW]: 0,
      [TrustLevel.MEDIUM]: 0,
      [TrustLevel.HIGH]: 0,
      [TrustLevel.VERIFIED]: 0,
    };

    let totalScore = 0;
    let verifiedCount = 0;
    let bannedCount = 0;

    for (const indicator of all) {
      trustDistribution[indicator.trustLevel]++;
      totalScore += indicator.trustScore;
      if (indicator.isVerified) verifiedCount++;
      if (indicator.isBanned) bannedCount++;
    }

    return {
      totalUsers: all.length,
      averageTrustScore: all.length > 0 ? totalScore / all.length : 0,
      verifiedCount,
      bannedCount,
      trustDistribution,
    };
  }
}
