import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
}

export interface TipGoal {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  isActive: boolean;
}

export interface SponsorshipPackage {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  price: number;
  duration: number; // days
  deliverables: string[];
  maxSlots: number;
  currentSlots: number;
}

export interface PayPerView {
  id: string;
  creatorId: string;
  contentId: string;
  contentType: 'article' | 'podcast' | 'course' | 'post';
  price: number;
  title: string;
  previewText: string;
}

@Injectable()
export class CreatorMonetizationService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Get creator monetization dashboard.
   */
  async getCreatorDashboard(creatorId: string) {
    const creator = await this.usersRepo.findOne({ where: { id: creatorId } });
    if (!creator) throw new NotFoundException('Creator not found');

    return {
      creatorId,
      totalEarnings: (creator as any).walletBalance || 0,
      subscriptionTiers: this.getDefaultTiers(),
      tipsEnabled: true,
      payPerViewEnabled: true,
      sponsorshipEnabled: true,
      creatorSplit: 90, // 90% to creator, 10% platform
      payoutMethods: ['stripe', 'crypto'],
      analytics: {
        totalSubscribers: 0,
        monthlyRecurringRevenue: 0,
        averageTipAmount: 0,
        totalPayPerViewSales: 0,
      },
    };
  }

  /**
   * Get default subscription tiers.
   */
  getDefaultTiers(): SubscriptionTier[] {
    return [
      {
        id: 'basic',
        name: 'Basic',
        price: 4.99,
        interval: 'monthly',
        features: ['Early access', 'Exclusive posts', 'Community access'],
        isActive: true,
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 9.99,
        interval: 'monthly',
        features: ['Everything in Basic', 'Behind-the-scenes', 'Monthly Q&A', 'Custom content'],
        isActive: true,
      },
      {
        id: 'vip',
        name: 'VIP',
        price: 24.99,
        interval: 'monthly',
        features: ['Everything in Premium', '1-on-1 monthly call', 'Personal shoutout', 'Signed merchandise'],
        isActive: true,
      },
      {
        id: 'whale',
        name: 'Whale',
        price: 99.99,
        interval: 'monthly',
        features: ['Everything in VIP', 'Custom video message', 'Priority support', 'Name in credits', 'Exclusive Discord'],
        isActive: true,
      },
    ];
  }

  /**
   * Process a tip from fan to creator.
   */
  async processTip(
    fanId: string,
    creatorId: string,
    amount: number,
    message?: string,
  ): Promise<{
    success: boolean;
    tipId: string;
    amount: number;
    creatorEarnings: number;
    platformFee: number;
  }> {
    if (amount < 1) throw new BadRequestException('Minimum tip is $1');
    if (amount > 10000) throw new BadRequestException('Maximum tip is $10,000');
    if (fanId === creatorId) throw new BadRequestException('Cannot tip yourself');

    const platformFee = amount * 0.10; // 10% platform fee
    const creatorEarnings = amount - platformFee;

    // Debit fan
    await this.walletService.debit(fanId, amount, {
      purpose: 'tip',
      type: 'payout',
      reference: `tip_${fanId}_${creatorId}_${Date.now()}`,
      metadata: { creatorId, message },
    });

    // Credit creator (90%)
    await this.walletService.credit(creatorId, creatorEarnings, {
      purpose: 'tip-received',
      type: 'earning',
      reference: `tip_${fanId}_${creatorId}_${Date.now()}`,
      metadata: { fanId, message, platformFee },
    });

    return {
      success: true,
      tipId: `tip_${Date.now()}`,
      amount,
      creatorEarnings,
      platformFee,
    };
  }

  /**
   * Process subscription payment.
   */
  async processSubscription(
    fanId: string,
    creatorId: string,
    tierId: string,
  ): Promise<{
    success: boolean;
    subscriptionId: string;
    tier: string;
    amount: number;
    nextBillingDate: Date;
  }> {
    const tiers = this.getDefaultTiers();
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) throw new BadRequestException('Invalid subscription tier');

    if (fanId === creatorId) throw new BadRequestException('Cannot subscribe to yourself');

    const platformFee = tier.price * 0.10;
    const creatorEarnings = tier.price - platformFee;

    // Debit fan
    await this.walletService.debit(fanId, tier.price, {
      purpose: 'subscription',
      type: 'payout',
      reference: `sub_${fanId}_${creatorId}_${tierId}_${Date.now()}`,
      metadata: { creatorId, tierId, interval: tier.interval },
    });

    // Credit creator (90%)
    await this.walletService.credit(creatorId, creatorEarnings, {
      purpose: 'subscription-received',
      type: 'earning',
      reference: `sub_${fanId}_${creatorId}_${tierId}_${Date.now()}`,
      metadata: { fanId, tierId, platformFee },
    });

    const nextBillingDate = new Date();
    if (tier.interval === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    return {
      success: true,
      subscriptionId: `sub_${Date.now()}`,
      tier: tierId,
      amount: tier.price,
      nextBillingDate,
    };
  }

  /**
   * Process pay-per-view purchase.
   */
  async processPayPerView(
    buyerId: string,
    creatorId: string,
    contentId: string,
    contentType: 'article' | 'podcast' | 'course' | 'post',
    price: number,
  ): Promise<{
    success: boolean;
    purchaseId: string;
    amount: number;
    accessUrl: string;
  }> {
    if (price < 0.5) throw new BadRequestException('Minimum price is $0.50');
    if (buyerId === creatorId) throw new BadRequestException('Cannot purchase your own content');

    const platformFee = price * 0.10;
    const creatorEarnings = price - platformFee;

    // Debit buyer
    await this.walletService.debit(buyerId, price, {
      purpose: 'pay-per-view',
      type: 'payout',
      reference: `ppv_${buyerId}_${contentId}_${Date.now()}`,
      metadata: { creatorId, contentType, contentId },
    });

    // Credit creator (90%)
    await this.walletService.credit(creatorId, creatorEarnings, {
      purpose: 'pay-per-view-received',
      type: 'earning',
      reference: `ppv_${buyerId}_${contentId}_${Date.now()}`,
      metadata: { buyerId, contentType, contentId, platformFee },
    });

    return {
      success: true,
      purchaseId: `ppv_${Date.now()}`,
      amount: price,
      accessUrl: `/${contentType}/${contentId}`,
    };
  }

  /**
   * Get creator earnings summary.
   */
  async getCreatorEarnings(creatorId: string) {
    const creator = await this.usersRepo.findOne({ where: { id: creatorId } });
    if (!creator) throw new NotFoundException('Creator not found');

    return {
      balance: (creator as any).walletBalance || 0,
      currency: 'usd',
      lifetimeEarnings: 0, // Would calculate from ledger
      pendingPayouts: 0,
      payoutHistory: [],
      tipsReceived: 0,
      subscriptionsReceived: 0,
      payPerViewSales: 0,
      platformFees: 0,
    };
  }
}
