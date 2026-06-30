import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { SubscriptionTier } from './entities/subscription-tier.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionTier)
    private subscriptionTiersRepository: Repository<SubscriptionTier>,
    private usersService: UsersService,
  ) {}

  async createSubscription(
    subscriberId: string,
    creatorId: string,
    tier: string,
  ): Promise<Subscription> {
    const subscriber = await this.usersService.findOneById(subscriberId);
    const creator = await this.usersService.findOneById(creatorId);

    if (!subscriber || !creator) {
      throw new NotFoundException('User not found');
    }

    const subscription = this.subscriptionsRepository.create({
      subscriber,
      creator,
      tier,
      status: SubscriptionStatus.ACTIVE,
      expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month from now
    });

    return this.subscriptionsRepository.save(subscription);
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({ where: { id: subscriptionId } });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status = SubscriptionStatus.CANCELED;
    return this.subscriptionsRepository.save(subscription);
  }

  async getSubscriptions(userId: string): Promise<Subscription[]> {
    return this.subscriptionsRepository.find({
      where: { subscriber: { id: userId } },
      relations: ['creator'],
    });
  }

  async getSubscribers(userId: string): Promise<Subscription[]> {
    return this.subscriptionsRepository.find({
      where: { creator: { id: userId } },
      relations: ['subscriber'],
    });
  }

  async getSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
        where: { id: subscriptionId },
        relations: ['creator', 'subscriber'],
    });

    if (!subscription) {
        throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async createSubscriptionTier(
    creatorId: string,
    name: string,
    price: number,
  ): Promise<SubscriptionTier> {
    const creator = await this.usersService.findOneById(creatorId);
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    const tier = this.subscriptionTiersRepository.create({
      name,
      price,
      creator,
    });

    return this.subscriptionTiersRepository.save(tier);
  }

  async getCreatorSubscriptionTiers(creatorId: string): Promise<SubscriptionTier[]> {
    return this.subscriptionTiersRepository.find({
      where: { creator: { id: creatorId } },
    });
  }

  async updateSubscriptionTier(
    creatorId: string,
    tierId: string,
    updates: Partial<{ name: string; price: number }>,
  ): Promise<SubscriptionTier> {
    const tier = await this.subscriptionTiersRepository.findOne({
      where: { id: tierId },
      relations: ['creator'],
    });

    if (!tier) {
      throw new NotFoundException('Subscription tier not found');
    }

    if (tier.creator.id !== creatorId) {
      throw new ForbiddenException('You can only update your own subscription tiers');
    }

    Object.assign(tier, updates);
    return this.subscriptionTiersRepository.save(tier);
  }

  async deleteSubscriptionTier(creatorId: string, tierId: string): Promise<void> {
    const tier = await this.subscriptionTiersRepository.findOne({
      where: { id: tierId },
      relations: ['creator'],
    });

    if (!tier) {
      throw new NotFoundException('Subscription tier not found');
    }

    if (tier.creator.id !== creatorId) {
      throw new ForbiddenException('You can only delete your own subscription tiers');
    }

    await this.subscriptionTiersRepository.remove(tier);
  }
}