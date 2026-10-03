
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tip } from './entities/tip.entity';
import { CreateTipDto } from './dto/create-tip.dto';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { ReputationService } from '../reputation/reputation.service';
import { ReputationEvent } from '../reputation/reputation.enum';
import { PaymentsService } from '../payments/payments.service';
import { WalletService } from '../wallet/wallet.service';

export interface TipResult {
  success: boolean;
  tipId: string | null;
  amount: number;
  currency: string;
  method: 'fiat' | 'crypto';
  fromUserId: string;
  toUserId: string;
  postId?: string;
  paymentId?: string | null;
  transactionId?: string | null;
  clientSecret?: string | null;
  status?: string;
}

@Injectable()
export class TippingService {
  constructor(
    @InjectRepository(Tip)
    private tipsRepository: Repository<Tip>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private readonly reputationService: ReputationService,
    private readonly paymentsService: PaymentsService,
    private readonly walletService: WalletService,
  ) {
    if (typeof this.paymentsService.registerFulfillmentHandler === 'function') {
      this.paymentsService.registerFulfillmentHandler('tip', async (transaction) => {
        await this.fulfillFiatTip(transaction);
      });
    }
  }

  /**
   * Create a fiat tip using Stripe via PaymentsService
   */
  async createFiatTip(
    fromUserId: string,
    toUserId: string,
    amount: number,
    postId?: string,
    currency: string = 'usd',
    paymentMethodId?: string,
  ): Promise<TipResult> {
    if (amount <= 0) {
      throw new BadRequestException('Tip amount must be greater than zero');
    }

    if (amount < 1) {
      throw new BadRequestException('Minimum tip amount is $1.00');
    }

    const fromUser = await this.usersRepository.findOne({ where: { id: fromUserId } });
    const toUser = await this.usersRepository.findOne({ where: { id: toUserId } });

    if (!fromUser || !toUser) {
      throw new NotFoundException('User not found');
    }

    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot tip yourself');
    }

    let post: Post | undefined;
    if (postId) {
      post = await this.postsRepository.findOne({ where: { id: postId } });
      if (!post) {
        throw new NotFoundException('Post not found');
      }
    }

    const metadata = {
      fulfillmentType: 'tip',
      fromUserId,
      toUserId,
      postId,
      type: 'tip',
    };
    const payment = await this.paymentsService.processPayment(
      fromUserId,
      amount,
      'tip',
      {
        currency,
        payerId: fromUserId,
        recipientId: toUserId,
        metadata,
        platformFeeRate: 0.10,
        paymentMethodId,
      },
    );

    if (!payment?.success) {
      return {
        success: false,
        tipId: null,
        amount,
        currency,
        method: 'fiat',
        fromUserId,
        toUserId,
        postId,
        paymentId: payment?.paymentId ?? null,
        transactionId: payment?.transactionId ?? null,
        clientSecret: payment?.clientSecret ?? null,
        status: payment?.status ?? 'requires_payment_method',
      };
    }

    const savedTip = payment.fulfillmentCompleted
      ? await this.tipsRepository.findOne({ where: { txHash: payment.paymentId } })
      : await this.fulfillFiatTip({
          id: payment.transactionId,
          paymentId: payment.paymentId,
          amount,
          currency,
          metadata,
          payer: { id: fromUserId },
          recipient: { id: toUserId },
        });
    if (!savedTip) {
      throw new Error('Fiat tip payment succeeded but the tip was not created');
    }

    return {
      success: true,
      tipId: savedTip.id,
      amount,
      currency,
      method: 'fiat',
      fromUserId,
      toUserId,
      postId,
      paymentId: payment.paymentId ?? null,
      transactionId: payment.transactionId ?? null,
      clientSecret: payment.clientSecret ?? null,
      status: payment.status,
    };
  }

  private async fulfillFiatTip(transaction: any): Promise<Tip | null> {
    const metadata = transaction?.metadata ?? {};
    const fromUserId = metadata.fromUserId ?? transaction?.payer?.id;
    const toUserId = metadata.toUserId ?? transaction?.recipient?.id;
    const paymentId = transaction?.paymentId ?? transaction?.id;
    if (!fromUserId || !toUserId || !paymentId) {
      throw new Error('Tip payment metadata is incomplete');
    }

    const existing = await this.tipsRepository.findOne({
      where: { txHash: paymentId },
    });
    if (existing) {
      return existing;
    }

    const fromUser = await this.usersRepository.findOne({ where: { id: fromUserId } });
    const toUser = await this.usersRepository.findOne({ where: { id: toUserId } });
    if (!fromUser || !toUser) {
      throw new NotFoundException('Tip user not found');
    }

    const postId = metadata.postId;
    const post = postId
      ? await this.postsRepository.findOne({ where: { id: postId } })
      : undefined;
    const tip = this.tipsRepository.create({
      from: fromUser,
      to: toUser,
      amount: Number(transaction.amount),
      currency: transaction.currency ?? 'usd',
      txHash: paymentId,
      post,
      method: 'fiat',
    });
    const savedTip = await this.tipsRepository.save(tip);
    await this.reputationService.addReputation(ReputationEvent.TIP_SENT, fromUser);
    await this.reputationService.addReputation(ReputationEvent.TIP_RECEIVED, toUser);
    return savedTip;
  }

  /**
   * Create a crypto tip using wallet transfer
   */
  async createCryptoTip(
    fromUserId: string,
    toUserId: string,
    amount: number,
    postId?: string,
    txHash?: string,
  ): Promise<TipResult> {
    if (amount <= 0) {
      throw new BadRequestException('Tip amount must be greater than zero');
    }

    const fromUser = await this.usersRepository.findOne({ where: { id: fromUserId } });
    const toUser = await this.usersRepository.findOne({ where: { id: toUserId } });

    if (!fromUser || !toUser) {
      throw new NotFoundException('User not found');
    }

    if (!fromUser.walletAddress || !toUser.walletAddress) {
      throw new BadRequestException('Both users must have connected wallets for crypto tips');
    }

    let post: Post | undefined;
    if (postId) {
      post = await this.postsRepository.findOne({ where: { id: postId } });
      if (!post) {
        throw new NotFoundException('Post not found');
      }
    }

    // Create tip record
    const tip = this.tipsRepository.create({
      from: fromUser,
      to: toUser,
      amount,
      currency: 'usd',
      post,
      txHash,
      method: 'crypto',
    });

    const savedTip = await this.tipsRepository.save(tip);

    // Add reputation
    await this.reputationService.addReputation(ReputationEvent.TIP_SENT, fromUser);
    await this.reputationService.addReputation(ReputationEvent.TIP_RECEIVED, toUser);

    return {
      success: true,
      tipId: savedTip.id,
      amount,
      currency: 'usd',
      method: 'crypto',
      fromUserId,
      toUserId,
      postId,
    };
  }

  /**
   * Legacy create method for backward compatibility
   */
  async create(createTipDto: CreateTipDto): Promise<Tip> {
    const { fromAddress, toAddress, amount, txHash, postId } = createTipDto;

    const fromUser = await this.usersRepository.findOne({ where: { walletAddress: fromAddress } });
    const toUser = await this.usersRepository.findOne({ where: { walletAddress: toAddress } });

    if (!fromUser || !toUser) {
      throw new Error('Invalid user');
    }

    let post: Post | undefined;
    if (postId) {
      post = await this.postsRepository.findOne({ where: { id: postId } });
    }

    if (!post) {
      throw new Error('Invalid post');
    }

    const tip = this.tipsRepository.create({
      from: fromUser,
      to: toUser,
      amount,
      txHash,
      post,
      method: 'crypto',
    });

    await this.reputationService.addReputation(ReputationEvent.TIP_SENT, fromUser);
    await this.reputationService.addReputation(ReputationEvent.TIP_RECEIVED, toUser);

    return this.tipsRepository.save(tip);
  }

  async getLeaderboard(
    period: 'all' | 'weekly' | 'monthly' = 'all',
    limit = 50,
  ): Promise<LeaderboardEntry[]> {
    const since =
      period === 'weekly'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : period === 'monthly'
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          : null;

    const qb = this.tipsRepository
      .createQueryBuilder('tip')
      .leftJoin('tip.to', 'recipient')
      .select('recipient.id', 'toId')
      .addSelect('SUM(tip.amount)', 'total')
      .addSelect('COUNT(tip.id)', 'tipCount')
      .groupBy('recipient.id')
      .orderBy('total', 'DESC')
      .limit(Math.min(Math.max(limit, 1), 100));

    if (since) {
      qb.where('tip.createdAt >= :since', { since });
    }

    const rows = (await qb.getRawMany()) as Array<{
      toId: string;
      total: string;
      tipCount: string;
    }>;

    if (rows.length === 0) {
      return [];
    }

    const users = await this.usersRepository.find({
      where: { id: In(rows.map((r) => r.toId)) },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return rows.map((row, index) => {
      const user = userMap.get(row.toId);
      return {
        rank: index + 1,
        totalAmount: Number(row.total),
        tipCount: Number(row.tipCount),
        user: user
          ? {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              avatar: user.avatar,
            }
          : { id: row.toId },
      };
    });
  }

  async getTipHistory(userId: string, limit = 50): Promise<Tip[]> {
    return this.tipsRepository.find({
      where: [
        { from: { id: userId } },
        { to: { id: userId } },
      ],
      relations: ['from', 'to', 'post'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

export interface LeaderboardEntry {
  rank: number;
  totalAmount: number;
  tipCount: number;
  user: {
    id: string;
    username?: string | null;
    displayName?: string | null;
    avatar?: string | null;
  };
}