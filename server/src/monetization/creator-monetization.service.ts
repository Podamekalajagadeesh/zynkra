import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { LedgerEntry } from '../wallet/entities/ledger-entry.entity';
import { PLATFORM_USER_ID, splitRevenue } from '../payments/revenue-split';

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
    @InjectRepository(LedgerEntry) private readonly ledgerRepo: Repository<LedgerEntry>,
    private readonly walletService: WalletService
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
        features: [
          'Everything in Premium',
          '1-on-1 monthly call',
          'Personal shoutout',
          'Signed merchandise',
        ],
        isActive: true,
      },
      {
        id: 'whale',
        name: 'Whale',
        price: 99.99,
        interval: 'monthly',
        features: [
          'Everything in VIP',
          'Custom video message',
          'Priority support',
          'Name in credits',
          'Exclusive Discord',
        ],
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
    message?: string
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

    const { platformFee, recipientAmount } = splitRevenue(amount);
    const creatorEarnings = recipientAmount;
    const reference = `tip_${fanId}_${creatorId}_${Date.now()}`;

    // Debit fan
    await this.walletService.debit(fanId, amount, {
      purpose: 'tip',
      type: 'payout',
      reference,
      metadata: { creatorId, message },
    });

    // Credit creator (90%)
    await this.walletService.credit(creatorId, creatorEarnings, {
      purpose: 'tip-received',
      type: 'earning',
      reference,
      metadata: { fanId, message, platformFee },
    });

    // Credit platform (10%) so the fee is a real ledger balance, not a vanishing cut
    if (platformFee > 0) {
      await this.walletService.credit(PLATFORM_USER_ID, platformFee, {
        purpose: 'platform-fee',
        type: 'earning',
        reference,
        metadata: { kind: 'tip', fanId, creatorId },
      });
    }

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
    tierId: string
  ): Promise<{
    success: boolean;
    subscriptionId: string;
    tier: string;
    amount: number;
    nextBillingDate: Date;
  }> {
    const tiers = this.getDefaultTiers();
    const tier = tiers.find((t) => t.id === tierId);
    if (!tier) throw new BadRequestException('Invalid subscription tier');

    if (fanId === creatorId) throw new BadRequestException('Cannot subscribe to yourself');

    const { platformFee, recipientAmount } = splitRevenue(tier.price);
    const creatorEarnings = recipientAmount;
    const reference = `sub_${fanId}_${creatorId}_${tierId}_${Date.now()}`;

    // Debit fan
    await this.walletService.debit(fanId, tier.price, {
      purpose: 'subscription',
      type: 'payout',
      reference,
      metadata: { creatorId, tierId, interval: tier.interval },
    });

    // Credit creator (90%)
    await this.walletService.credit(creatorId, creatorEarnings, {
      purpose: 'subscription-received',
      type: 'earning',
      reference,
      metadata: { fanId, tierId, platformFee },
    });

    if (platformFee > 0) {
      await this.walletService.credit(PLATFORM_USER_ID, platformFee, {
        purpose: 'platform-fee',
        type: 'earning',
        reference,
        metadata: { kind: 'subscription', fanId, creatorId, tierId },
      });
    }

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
    price: number
  ): Promise<{
    success: boolean;
    purchaseId: string;
    amount: number;
    accessUrl: string;
  }> {
    if (price < 0.5) throw new BadRequestException('Minimum price is $0.50');
    if (buyerId === creatorId) throw new BadRequestException('Cannot purchase your own content');

    const { platformFee, recipientAmount } = splitRevenue(price);
    const creatorEarnings = recipientAmount;
    const reference = `ppv_${buyerId}_${contentId}_${Date.now()}`;

    // Debit buyer
    await this.walletService.debit(buyerId, price, {
      purpose: 'pay-per-view',
      type: 'payout',
      reference,
      metadata: { creatorId, contentType, contentId },
    });

    // Credit creator (90%)
    await this.walletService.credit(creatorId, creatorEarnings, {
      purpose: 'pay-per-view-received',
      type: 'earning',
      reference,
      metadata: { buyerId, contentType, contentId, platformFee },
    });

    if (platformFee > 0) {
      await this.walletService.credit(PLATFORM_USER_ID, platformFee, {
        purpose: 'platform-fee',
        type: 'earning',
        reference,
        metadata: { kind: 'pay-per-view', buyerId, creatorId, contentId },
      });
    }

    return {
      success: true,
      purchaseId: `ppv_${Date.now()}`,
      amount: price,
      accessUrl: `/${contentType}/${contentId}`,
    };
  }

  /**
   * Get creator earnings summary from the append-only wallet ledger.
   */
  async getCreatorEarnings(creatorId: string) {
    const creator = await this.usersRepo.findOne({ where: { id: creatorId } });
    if (!creator) throw new NotFoundException('Creator not found');

    const entries = await this.ledgerRepo.find({
      where: { user: { id: creatorId } as User },
      order: { createdAt: 'DESC' },
      take: 1000,
    });

    let lifetimeEarnings = 0;
    let tipsReceived = 0;
    let subscriptionsReceived = 0;
    let payPerViewSales = 0;
    const payoutHistory: Array<{
      id: string;
      amount: number;
      type: string;
      purpose: string | null;
      reference: string | null;
      createdAt: Date;
    }> = [];

    for (const entry of entries) {
      const amount = Number(entry.amount);
      if (amount > 0 && entry.type === 'earning') {
        lifetimeEarnings += amount;
        const purpose = entry.purpose ?? '';
        if (purpose === 'tip' || purpose === 'tip-received') tipsReceived += amount;
        else if (purpose === 'subscription' || purpose === 'subscription-received') {
          subscriptionsReceived += amount;
        } else if (purpose === 'pay-per-view' || purpose === 'pay-per-view-received') {
          payPerViewSales += amount;
        }
      }
      if (amount < 0 && entry.type === 'payout') {
        payoutHistory.push({
          id: entry.id,
          amount,
          type: entry.type,
          purpose: entry.purpose,
          reference: entry.reference,
          createdAt: entry.createdAt,
        });
      }
    }

    // Platform's lifetime cut is the sum of platform-fee credits to the system account
    // attributed to this creator via metadata — not part of the creator's own ledger.
    const platformFeeEntries = await this.ledgerRepo.find({
      where: {
        user: { id: PLATFORM_USER_ID } as User,
        purpose: 'platform-fee',
      },
      order: { createdAt: 'DESC' },
      take: 5000,
    });
    let platformFees = 0;
    for (const entry of platformFeeEntries) {
      const meta = entry.metadata ?? {};
      if (meta.creatorId === creatorId) {
        platformFees += Number(entry.amount);
      }
    }

    return {
      balance: Number((creator as any).walletBalance || 0),
      currency: 'usd',
      lifetimeEarnings: Math.round(lifetimeEarnings * 100) / 100,
      pendingPayouts: payoutHistory.length,
      payoutHistory,
      tipsReceived: Math.round(tipsReceived * 100) / 100,
      subscriptionsReceived: Math.round(subscriptionsReceived * 100) / 100,
      payPerViewSales: Math.round(payPerViewSales * 100) / 100,
      platformFees: Math.round(platformFees * 100) / 100,
      entryCount: entries.length,
    };
  }
}
