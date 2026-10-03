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
import { UsersService } from '../users/users.service';
import { PaymentsService } from '../payments/payments.service';

export interface SubscriptionPaymentResult {
  success: boolean;
  status: string;
  paymentId: string | null;
  transactionId?: string | null;
  clientSecret: string | null;
  subscription: Subscription | null;
}

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
  ) {
    if (typeof this.paymentsService.registerFulfillmentHandler === 'function') {
      this.paymentsService.registerFulfillmentHandler('subscription', async (transaction) => {
        await this.fulfillSubscription(transaction);
      });
    }
  }

  async createSubscription(
    subscriberId: string,
    creatorId: string,
    tier: string,
    paymentMethodId?: string,
  ): Promise<Subscription | SubscriptionPaymentResult> {
    const subscriber = await this.usersService.findOneById(subscriberId);
    const creator = await this.usersService.findOneById(creatorId);

    if (!subscriber || !creator) {
      throw new NotFoundException('User not found');
    }
    if (subscriberId === creatorId) {
      throw new BadRequestException('Cannot subscribe to yourself');
    }

    const existingSubscription = await this.subscriptionsRepository.findOne({
      where: {
        subscriber: { id: subscriberId },
        creator: { id: creatorId },
        tier,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['creator', 'subscriber'],
    });

    if (existingSubscription) {
      return existingSubscription;
    }

    const tierRecord = await this.subscriptionTiersRepository.findOne({
      where: { name: tier, creator: { id: creatorId } },
      relations: ['creator'],
    });
    if (!tierRecord) {
      throw new NotFoundException('Subscription tier not found');
    }

    const amount = Number(tierRecord.price);
    const metadata = {
      fulfillmentType: 'subscription',
      subscriberId,
      creatorId,
      tier: tierRecord.name,
      tierId: tierRecord.id,
    };
    const payment = await this.paymentsService.processPayment(
      subscriberId,
      amount,
      'subscription',
      {
        currency: 'usd',
        payerId: subscriberId,
        recipientId: creatorId,
        metadata,
        platformFeeRate: 0.10,
        paymentMethodId,
      },
    );

    if (!payment?.success) {
      return {
        success: false,
        status: payment?.status ?? 'requires_payment_method',
        paymentId: payment?.paymentId ?? null,
        transactionId: payment?.transactionId ?? null,
        clientSecret: payment?.clientSecret ?? null,
        subscription: null,
      };
    }

    const subscription = payment.fulfillmentCompleted
      ? await this.subscriptionsRepository.findOne({
          where: {
            subscriber: { id: subscriberId },
            creator: { id: creatorId },
            tier: metadata.tier,
            status: SubscriptionStatus.ACTIVE,
          },
          relations: ['creator', 'subscriber'],
        })
      : await this.fulfillSubscription({
          id: payment.transactionId,
          paymentId: payment.paymentId,
          amount,
          currency: 'usd',
          metadata,
          payer: { id: subscriberId },
          recipient: { id: creatorId },
        });
    if (subscription) {
      return subscription;
    }

    return {
      success: true,
      status: payment.status,
      paymentId: payment.paymentId ?? null,
      transactionId: payment.transactionId ?? null,
      clientSecret: payment.clientSecret ?? null,
      subscription: null,
    };
  }

  async cancelSubscription(subscriptionId: string, userId?: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId },
      relations: ['subscriber'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    if (userId && subscription.subscriber?.id !== userId) {
      throw new ForbiddenException('You can only cancel your own subscriptions');
    }

    subscription.status = SubscriptionStatus.CANCELED;
    return this.subscriptionsRepository.save(subscription);
  }

  async getSubscriptions(userId: string): Promise<Subscription[]> {
    const subscriptions = await this.subscriptionsRepository.find({
      where: { subscriber: { id: userId } },
      relations: ['creator'],
    });
    const now = Date.now();
    return subscriptions.filter(
      (subscription) =>
        subscription.status === SubscriptionStatus.ACTIVE &&
        (!subscription.expiresAt || new Date(subscription.expiresAt).getTime() > now),
    );
  }

  async getSubscribers(userId: string): Promise<Subscription[]> {
    return this.subscriptionsRepository.find({
      where: { creator: { id: userId } },
      relations: ['subscriber'],
    });
  }

  async getSubscription(subscriptionId: string, userId?: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId },
      relations: ['creator', 'subscriber'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    if (userId && subscription.subscriber?.id !== userId) {
      throw new ForbiddenException('You can only view your own subscriptions');
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

    const nextTierEntities =
      dto.tierIds !== undefined
        ? await this.loadOwnedTiers(creatorId, dto.tierIds)
        : bundle.tiers.map((entry) => entry.tier);
    const tierSum = nextTierEntities.reduce((sum, tier) => sum + Number(tier.price), 0);
    const price = dto.price !== undefined ? dto.price : Number(bundle.price);
    if (price > tierSum) {
      throw new BadRequestException(
        `Bundle price cannot exceed the sum of its tier prices ($${tierSum.toFixed(2)})`,
      );
    }

    if (dto.name !== undefined) bundle.name = dto.name;
    if (dto.description !== undefined) bundle.description = dto.description;
    if (dto.isActive !== undefined) bundle.isActive = dto.isActive;
    bundle.price = price;

    if (dto.tierIds !== undefined) {
      await this.bundleTiersRepository.remove(bundle.tiers);
      bundle.tiers = nextTierEntities.map((tier) =>
        this.bundleTiersRepository.create({ bundle, tier }),
      );
      await this.bundleTiersRepository.save(bundle.tiers);
    }

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

  async purchaseBundle(
    subscriberId: string,
    bundleId: string,
    paymentMethodId?: string,
  ): Promise<Subscription | SubscriptionPaymentResult> {
    const bundle = await this.getBundle(bundleId);
    if (!bundle.isActive) {
      throw new BadRequestException('This bundle is no longer available');
    }
    const creator = bundle.creator;
    if (subscriberId === creator.id) {
      throw new BadRequestException('Cannot purchase your own bundle');
    }

    const existing = await this.subscriptionsRepository.findOne({
      where: {
        subscriber: { id: subscriberId },
        creator: { id: creator.id },
        tier: `bundle:${bundle.name}`,
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

    const metadata = {
      fulfillmentType: 'subscription',
      subscriptionType: 'bundle',
      subscriberId,
      creatorId: creator.id,
      tier: `bundle:${bundle.name}`,
      bundleId,
      bundleName: bundle.name,
    };
    const payment = await this.paymentsService.processPayment(
      subscriberId,
      Number(bundle.price),
      'subscription',
      {
        currency: 'usd',
        payerId: subscriberId,
        recipientId: creator.id,
        metadata,
        platformFeeRate: 0.10,
        paymentMethodId,
      },
    );

    if (!payment?.success) {
      return {
        success: false,
        status: payment?.status ?? 'requires_payment_method',
        paymentId: payment?.paymentId ?? null,
        transactionId: payment?.transactionId ?? null,
        clientSecret: payment?.clientSecret ?? null,
        subscription: null,
      };
    }

    const subscription = payment.fulfillmentCompleted
      ? await this.subscriptionsRepository.findOne({
          where: {
            subscriber: { id: subscriberId },
            creator: { id: creator.id },
            tier: metadata.tier,
            status: SubscriptionStatus.ACTIVE,
          },
          relations: ['creator', 'subscriber'],
        })
      : await this.fulfillSubscription({
          id: payment.transactionId,
          paymentId: payment.paymentId,
          amount: Number(bundle.price),
          currency: 'usd',
          metadata,
          payer: { id: subscriberId },
          recipient: { id: creator.id },
        });
    if (subscription) {
      return subscription;
    }

    return {
      success: true,
      status: payment.status,
      paymentId: payment.paymentId ?? null,
      transactionId: payment.transactionId ?? null,
      clientSecret: payment.clientSecret ?? null,
      subscription: null,
    };
  }

  private async fulfillSubscription(transaction: any): Promise<Subscription | null> {
    const metadata = transaction?.metadata ?? {};
    const subscriberId = metadata.subscriberId ?? transaction?.payer?.id;
    const creatorId = metadata.creatorId ?? transaction?.recipient?.id;
    const tier = metadata.tier;
    if (!subscriberId || !creatorId || !tier) {
      throw new Error('Subscription payment metadata is incomplete');
    }

    const existing = await this.subscriptionsRepository.findOne({
      where: {
        subscriber: { id: subscriberId },
        creator: { id: creatorId },
        tier,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['creator', 'subscriber'],
    });
    if (existing) {
      return existing;
    }

    const subscriber = await this.usersService.findOneById(subscriberId);
    const creator = await this.usersService.findOneById(creatorId);
    if (!subscriber || !creator) {
      throw new NotFoundException('Subscription user not found');
    }

    const requestedExpiry = metadata.expiresAt ? new Date(metadata.expiresAt) : null;
    const expiresAt =
      requestedExpiry && !Number.isNaN(requestedExpiry.getTime())
        ? requestedExpiry
        : this.oneMonthFromNow();
    const subscription = this.subscriptionsRepository.create({
      subscriber,
      creator,
      tier,
      status: SubscriptionStatus.ACTIVE,
      expiresAt,
    });
    return this.subscriptionsRepository.save(subscription);
  }

  private oneMonthFromNow(): Date {
    const date = new Date();
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + 1);
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    ).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
    return date;
  }

  private async loadOwnedTiers(
    creatorId: string,
    tierIds: string[],
  ): Promise<SubscriptionTier[]> {
    if (tierIds.length === 0) {
      throw new BadRequestException('A bundle needs at least one tier');
    }
    if (new Set(tierIds).size !== tierIds.length) {
      throw new BadRequestException('A bundle cannot contain duplicate tiers');
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