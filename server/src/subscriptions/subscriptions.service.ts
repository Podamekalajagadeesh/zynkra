import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { SubscriptionTier } from './entities/subscription-tier.entity';
import {
  SubscriptionBundle,
  SubscriptionBundleTier,
} from './entities/subscription-bundle.entity';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionTier)
    private subscriptionTiersRepository: Repository<SubscriptionTier>,
    @InjectRepository(SubscriptionBundle)
    private bundlesRepository: Repository<SubscriptionBundle>,
    @InjectRepository(SubscriptionBundleTier)
    private bundleTiersRepository: Repository<SubscriptionBundleTier>,
    private usersService: UsersService,
    private readonly paymentsService: PaymentsService,
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

    const existingSubscription = await this.subscriptionsRepository.findOne({
      where: {
        subscriber: { id: subscriberId },
        creator: { id: creatorId },
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['creator', 'subscriber'],
    });

    if (existingSubscription) {
      return existingSubscription;
    }

    const tierRecord = await this.subscriptionTiersRepository.findOne({ where: { creator: { id: creatorId } }, relations: ['creator'] });
    const amount = tierRecord?.price ?? 10;

    await this.paymentsService.processPayment(subscriberId, Number(amount), 'subscription', {
      currency: 'usd',
      payerId: subscriberId,
      recipientId: creatorId,
      metadata: { tier, creatorId },
    });

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

  async createBundle(creatorId: string, dto: CreateBundleDto): Promise<SubscriptionBundle> {
    const creator = await this.usersService.findOneById(creatorId);
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    const tiers = await this.loadOwnedTiers(creatorId, dto.tierIds);
    const tierSum = tiers.reduce((sum, tier) => sum + Number(tier.price), 0);
    if (dto.price > tierSum) {
      throw new BadRequestException(
        `Bundle price cannot exceed the sum of its tier prices ($${tierSum.toFixed(2)})`,
      );
    }

    const bundle = this.bundlesRepository.create({
      creator,
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      isActive: true,
    });
    await this.bundlesRepository.save(bundle);

    bundle.tiers = tiers.map((tier) =>
      this.bundleTiersRepository.create({ bundle, tier }),
    );
    await this.bundleTiersRepository.save(bundle.tiers);

    return this.getBundle(bundle.id);
  }

  async getBundle(bundleId: string): Promise<SubscriptionBundle> {
    const bundle = await this.bundlesRepository.findOne({
      where: { id: bundleId },
      relations: ['creator', 'tiers', 'tiers.tier'],
    });
    if (!bundle) {
      throw new NotFoundException('Subscription bundle not found');
    }
    return bundle;
  }

  async getCreatorBundles(creatorId: string): Promise<SubscriptionBundle[]> {
    return this.bundlesRepository.find({
      where: { creator: { id: creatorId }, isActive: true },
      relations: ['tiers', 'tiers.tier'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateBundle(creatorId: string, bundleId: string, dto: UpdateBundleDto): Promise<SubscriptionBundle> {
    const bundle = await this.bundlesRepository.findOne({
      where: { id: bundleId },
      relations: ['creator', 'tiers', 'tiers.tier'],
    });
    if (!bundle) {
      throw new NotFoundException('Subscription bundle not found');
    }
    if (bundle.creator.id !== creatorId) {
      throw new ForbiddenException('You can only update your own bundles');
    }

    if (dto.name !== undefined) bundle.name = dto.name;
    if (dto.description !== undefined) bundle.description = dto.description;
    if (dto.isActive !== undefined) bundle.isActive = dto.isActive;

    if (dto.tierIds !== undefined) {
      const tiers = await this.loadOwnedTiers(creatorId, dto.tierIds);
      await this.bundleTiersRepository.remove(bundle.tiers);
      bundle.tiers = tiers.map((tier) =>
        this.bundleTiersRepository.create({ bundle, tier }),
      );
      await this.bundleTiersRepository.save(bundle.tiers);
    }

    const tierSum = bundle.tiers.reduce((sum, t) => sum + Number(t.tier.price), 0);
    const price = dto.price !== undefined ? dto.price : Number(bundle.price);
    if (price > tierSum) {
      throw new BadRequestException(
        `Bundle price cannot exceed the sum of its tier prices ($${tierSum.toFixed(2)})`,
      );
    }
    bundle.price = price;

    return this.bundlesRepository.save(bundle);
  }

  async deleteBundle(creatorId: string, bundleId: string): Promise<void> {
    const bundle = await this.bundlesRepository.findOne({
      where: { id: bundleId },
      relations: ['creator'],
    });
    if (!bundle) {
      throw new NotFoundException('Subscription bundle not found');
    }
    if (bundle.creator.id !== creatorId) {
      throw new ForbiddenException('You can only delete your own bundles');
    }
    await this.bundlesRepository.remove(bundle);
  }

  async purchaseBundle(subscriberId: string, bundleId: string): Promise<Subscription> {
    const bundle = await this.getBundle(bundleId);
    if (!bundle.isActive) {
      throw new BadRequestException('This bundle is no longer available');
    }
    const creator = bundle.creator;

    const existing = await this.subscriptionsRepository.findOne({
      where: {
        subscriber: { id: subscriberId },
        creator: { id: creator.id },
        status: SubscriptionStatus.ACTIVE,
      },
    });
    if (existing) {
      return existing;
    }

    const subscriber = await this.usersService.findOneById(subscriberId);
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    await this.paymentsService.processPayment(subscriberId, Number(bundle.price), 'subscription', {
      currency: 'usd',
      payerId: subscriberId,
      recipientId: creator.id,
      metadata: { bundleId, bundleName: bundle.name, creatorId: creator.id },
    });

    const subscription = this.subscriptionsRepository.create({
      subscriber,
      creator,
      tier: `bundle:${bundle.name}`,
      status: SubscriptionStatus.ACTIVE,
      expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });
    return this.subscriptionsRepository.save(subscription);
  }

  private async loadOwnedTiers(
    creatorId: string,
    tierIds: string[],
  ): Promise<SubscriptionTier[]> {
    if (tierIds.length === 0) {
      throw new BadRequestException('A bundle needs at least one tier');
    }
    const tiers = await this.subscriptionTiersRepository.find({
      where: { id: In(tierIds) },
      relations: ['creator'],
    });
    if (tiers.length !== new Set(tierIds).size) {
      throw new BadRequestException('One or more tiers were not found');
    }
    const foreign = tiers.find((tier) => tier.creator.id !== creatorId);
    if (foreign) {
      throw new ForbiddenException('You can only bundle your own tiers');
    }
    return tiers;
  }
}