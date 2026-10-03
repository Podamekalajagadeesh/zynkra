import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Payout } from './entities/payout.entity';
import { User } from '../users/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import {
  DEFAULT_PLATFORM_FEE_RATE,
  PLATFORM_USER_ID,
  splitRevenue,
} from './revenue-split';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');

export type PaymentFulfillmentHandler = (transaction: PaymentTransaction) => Promise<void>;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: any;
  private readonly paymentsEnabled: boolean;
  /** Stripe Connect payouts require both payments and a usable Stripe client. */
  private readonly connectEnabled: boolean;
  private readonly webhookSecret: string | undefined;
  private readonly clientUrl: string;
  private readonly fulfillmentHandlers = new Map<string, PaymentFulfillmentHandler>();

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly paymentRepository: Repository<PaymentTransaction>,
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => WebhooksService))
    private readonly webhooksService: WebhooksService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.paymentsEnabled =
      this.configService.get<string>('PAYMENTS_ENABLED') === 'true' && !!stripeKey;
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    this.clientUrl =
      this.configService.get<string>('CLIENT_URL') || 'http://127.0.0.1:5173';

    this.stripe = stripeKey
      ? new Stripe(stripeKey)
      : null;

    // Connect defaults to following PAYMENTS_ENABLED, but can be turned off
    // independently to force the manual admin-approved payout queue.
    const connectFlag = this.configService.get<string>('STRIPE_CONNECT_ENABLED');
    this.connectEnabled =
      this.paymentsEnabled &&
      !!this.stripe &&
      (connectFlag === undefined || connectFlag === 'true');
  }

  private assertPaymentsEnabled() {
    if (!this.paymentsEnabled || !this.stripe) {
      throw new ServiceUnavailableException(
        'Payments are not enabled on this instance. Set PAYMENTS_ENABLED=true and STRIPE_SECRET_KEY to enable them.',
      );
    }
  }

  registerFulfillmentHandler(type: string, handler: PaymentFulfillmentHandler): void {
    this.fulfillmentHandlers.set(type, handler);
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    options: { paymentMethodId?: string } = {},
  ): Promise<any> {
    this.assertPaymentsEnabled();
    return this.stripe.paymentIntents.create({
      amount,
      currency,
      ...(options.paymentMethodId
        ? { payment_method: options.paymentMethodId, confirm: true }
        : {}),
    });
  }

  async processPayment(
    userId: string,
    amount: number,
    purpose: string,
    options: {
      currency?: string;
      metadata?: Record<string, any>;
      payerId?: string;
      recipientId?: string;
      platformFeeRate?: number;
      paymentMethodId?: string;
    } = {},
  ) {
    this.assertPaymentsEnabled();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }
    const currency = String(options.currency || 'usd').toLowerCase();
    if (!/^[a-z]{3}$/.test(currency)) {
      throw new BadRequestException('Payment currency must be a three-letter code');
    }
    const feeRate = options.platformFeeRate ?? DEFAULT_PLATFORM_FEE_RATE;
    const paymentIntent = await this.createPaymentIntent(
      Math.round(numericAmount * 100),
      currency,
      { paymentMethodId: options.paymentMethodId },
    );

    const transaction = this.paymentRepository.create({
      provider: 'stripe',
      status: paymentIntent.status ?? 'requires_payment_method',
      paymentId: paymentIntent.id,
      purpose,
      amount: numericAmount,
      currency,
      metadata: {
        ...options.metadata,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
        platformFeeRate: feeRate,
      },
      payer: options.payerId ? ({ id: options.payerId } as any) : null,
      recipient: options.recipientId ? ({ id: options.recipientId } as any) : null,
    });

    const savedTransaction =
      (await this.paymentRepository.save(transaction)) ?? transaction;

    let fulfillmentCompleted = false;
    if (paymentIntent.status === 'succeeded') {
      try {
        fulfillmentCompleted = await this.confirmPaymentSucceeded(
          paymentIntent,
          savedTransaction,
        );
      } catch (err: any) {
        this.logger.error(
          `Immediate payment fulfillment deferred for ${paymentIntent.id}: ${err?.message ?? err}`,
        );
      }
    }

    return {
      success: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
      userId,
      amount: numericAmount,
      purpose,
      paymentId: savedTransaction.paymentId,
      transactionId: savedTransaction.id,
      clientSecret: paymentIntent.client_secret ?? null,
      fulfillmentCompleted,
      currency,
    };
  }

  async confirmPayment(
    paymentId: string,
    userId: string,
    paymentMethodId?: string,
  ) {
    this.assertPaymentsEnabled();
    const transaction = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['payer'],
    });
    if (!transaction || transaction.payer?.id !== userId) {
      throw new NotFoundException('Payment not found');
    }

    const paymentIntent = paymentMethodId
      ? await this.stripe.paymentIntents.confirm(paymentId, {
          payment_method: paymentMethodId,
        })
      : await this.stripe.paymentIntents.retrieve(paymentId);

    let fulfillmentCompleted = false;
    if (paymentIntent.status === 'succeeded') {
      fulfillmentCompleted = await this.confirmPaymentSucceeded(paymentIntent);
    } else if (
      paymentIntent.status === 'canceled' ||
      paymentIntent.status === 'payment_failed'
    ) {
      await this.markPaymentFailed(
        paymentIntent,
        paymentIntent.status === 'canceled'
          ? 'payment_intent.canceled'
          : 'payment_intent.payment_failed',
      );
    }

    return {
      success: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
      paymentId,
      clientSecret: paymentIntent.client_secret ?? null,
      fulfillmentCompleted,
    };
  }

  private async fulfillPayment(transaction: PaymentTransaction): Promise<boolean> {
    const fulfillmentType = transaction.metadata?.fulfillmentType;
    if (!fulfillmentType) {
      return false;
    }
    if (transaction.metadata?.fulfillmentStatus === 'completed') {
      return true;
    }

    const handler = this.fulfillmentHandlers.get(fulfillmentType);
    if (!handler) {
      return false;
    }

    await handler(transaction);
    transaction.metadata = {
      ...(transaction.metadata ?? {}),
      fulfillmentStatus: 'completed',
      fulfilledAt: new Date().toISOString(),
    };
    await this.paymentRepository.save(transaction);
    return true;
  }

  /**
   * Credit the recipient their net share and the platform fee account, both
   * with matching ledger rows. Idempotent callers must check status first.
   */
  private async creditRecipientWithSplit(
    transaction: PaymentTransaction,
    feeRate: number = DEFAULT_PLATFORM_FEE_RATE,
  ): Promise<void> {
    const recipientId = transaction.recipient?.id;
    if (!recipientId) return;
    const amount = Number(transaction.amount);
    if (!(amount > 0)) return;

    const split = splitRevenue(amount, feeRate);
    await this.walletService.credit(recipientId, split.recipientAmount, {
      purpose: transaction.purpose ?? 'payment',
      type: 'earning',
      reference: transaction.paymentId,
      metadata: { platformFee: split.platformFee, feeRate: split.feeRate },
    });
    if (split.platformFee > 0) {
      await this.walletService.credit(PLATFORM_USER_ID, split.platformFee, {
        purpose: 'platform-fee',
        type: 'earning',
        reference: transaction.paymentId,
        metadata: {
          feeRate: split.feeRate,
          gross: split.gross,
          recipientId,
          creatorId: recipientId,
          purpose: transaction.purpose,
        },
      });
    }
    transaction.metadata = {
      ...(transaction.metadata ?? {}),
      recipientCredited: split.recipientAmount,
      platformCredited: split.platformFee,
    };
    await this.paymentRepository.save(transaction);
  }

  async createDemoPaymentScenario(
    amount: number,
    currency: string,
    recipientId: string,
    payerId: string,
  ) {
    // Demo flow: never available in production, and never touches Stripe.
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new ServiceUnavailableException('Demo payments are disabled in production.');
    }

    const safeAmount = Number(amount);
    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const transaction = this.paymentRepository.create({
      provider: 'demo',
      status: 'succeeded',
      paymentId: `demo_${Date.now()}`,
      purpose: 'demo-poc',
      amount: safeAmount,
      currency,
      metadata: {
        scenario: 'proof-of-concept',
        mode: 'demo',
      },
      payer: payerId ? ({ id: payerId } as any) : null,
      recipient: recipientId ? ({ id: recipientId } as any) : null,
    });

    await this.paymentRepository.save(transaction);
    await this.walletService.credit(recipientId, safeAmount, { purpose: 'demo-poc' });

    return {
      success: true,
      status: 'succeeded',
      amount: safeAmount,
      currency,
      mode: 'demo',
      paymentId: transaction.paymentId,
      recipientId,
      payerId,
      transaction,
    };
  }

  async requestPayout(creatorId: string, amount: number, purpose: string) {
    const payoutAmount = Number(amount);
    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
      throw new BadRequestException('Payout amount must be greater than zero');
    }

    const creator = await this.usersRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    // Debit first — if the creator lacks funds this throws and no payout row is
    // created. The wallet ledger records the debit atomically.
    const payoutRef = `payout_${creatorId}_${randomUUID()}`;
    await this.walletService.debit(creatorId, payoutAmount, {
      purpose,
      type: 'payout',
      reference: payoutRef,
    });

    const payout = this.payoutRepository.create({
      creator: { id: creatorId } as any,
      amount: payoutAmount,
      currency: 'usd',
      status: 'pending',
      purpose,
      payoutId: payoutRef,
    });
    await this.payoutRepository.save(payout);

    // Manual path: no Stripe Connect, or the creator hasn't onboarded a payout
    // account yet — leave it pending for an admin to approve.
    if (!this.connectEnabled || !creator.stripeConnectAccountId || !creator.payoutsEnabled) {
      return this.serializePayout(payout, { mode: 'manual' });
    }

    // Connect path: send a real Stripe transfer to the creator's account.
    payout.status = 'processing';
    await this.payoutRepository.save(payout);

    let transfer: any;
    try {
      transfer = await this.stripe.transfers.create({
        amount: Math.round(payoutAmount * 100),
        currency: payout.currency,
        destination: creator.stripeConnectAccountId,
        metadata: { payoutId: payout.payoutId, creatorId },
      });
    } catch (err: any) {
      await this.walletService.credit(creatorId, payoutAmount, {
        purpose: 'payout-reversal',
        type: 'payout_reversal',
        reference: payout.payoutId,
      });
      const markedFailed = await this.updateProcessingPayout(payout.id, {
        status: 'failed',
        failureReason: err?.message ?? 'Stripe transfer failed',
        processedAt: new Date(),
      });
      if (!markedFailed) {
        return this.serializePayout(await this.getPayoutOrThrow(payout.id), { mode: 'stripe' });
      }
      return this.serializePayout(await this.getPayoutOrThrow(payout.id), { mode: 'stripe' });
    }

    const settled = await this.updateProcessingPayout(payout.id, {
      status: 'paid',
      stripeTransferId: transfer.id,
      processedAt: new Date(),
    });
    if (!settled) {
      return this.serializePayout(await this.getPayoutOrThrow(payout.id), { mode: 'stripe' });
    }
    payout.stripeTransferId = transfer.id;
    payout.status = 'paid';
    payout.processedAt = new Date();
    return this.serializePayout(payout, { mode: 'stripe' });
  }

  async getCreatorPayouts(creatorId: string) {
    return this.payoutRepository.find({
      where: { creator: { id: creatorId } as any },
      order: { createdAt: 'DESC' },
    });
  }

  async sendPayout(creatorId: string, amount: number, purpose: string) {
    return this.requestPayout(creatorId, amount, purpose);
  }

  // ---- Stripe Connect onboarding -----------------------------------------

  /** Report whether a creator can receive payouts, and via which rail. */
  async getConnectStatus(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.connectEnabled) {
      // Manual queue is always available — an admin settles payouts by hand.
      return {
        enabled: false,
        mode: 'manual' as const,
        payoutsEnabled: true,
        detailsSubmitted: true,
      };
    }

    let detailsSubmitted = false;
    let payoutsEnabled = user.payoutsEnabled;
    if (user.stripeConnectAccountId) {
      const account = await this.stripe.accounts.retrieve(user.stripeConnectAccountId);
      detailsSubmitted = !!account.details_submitted;
      payoutsEnabled = !!account.payouts_enabled;
      // Keep our cached flag in sync with Stripe's source of truth.
      if (payoutsEnabled !== user.payoutsEnabled) {
        user.payoutsEnabled = payoutsEnabled;
        await this.usersRepository.save(user);
      }
    }

    return {
      enabled: true,
      mode: 'stripe' as const,
      hasAccount: !!user.stripeConnectAccountId,
      detailsSubmitted,
      payoutsEnabled,
    };
  }

  /** Create (if needed) an Express account and return an onboarding link. */
  async createOnboardingLink(userId: string) {
    this.assertPaymentsEnabled();
    if (!this.connectEnabled) {
      throw new ServiceUnavailableException(
        'Stripe Connect is not enabled on this instance. Payouts are settled manually.',
      );
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeConnectAccountId) {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email: user.email ?? undefined,
        metadata: { userId },
        capabilities: { transfers: { requested: true } },
      });
      user.stripeConnectAccountId = account.id;
      await this.usersRepository.save(user);
    }

    const accountLink = await this.stripe.accountLinks.create({
      account: user.stripeConnectAccountId,
      refresh_url: `${this.clientUrl}/earnings?connect=refresh`,
      return_url: `${this.clientUrl}/earnings?connect=return`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }

  // ---- Admin manual payout queue -----------------------------------------

  async listPendingPayouts() {
    const payouts = await this.payoutRepository.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
    });
    const now = Date.now();
    return payouts.filter(
      (payout: Payout) => !payout.dueAt || new Date(payout.dueAt).getTime() <= now,
    );
  }

  /**
   * Schedules a payout to be released automatically at `dueAt`. The wallet is
   * debited immediately; the payout stays pending until the cron releases it.
   */
  async schedulePayout(
    creatorId: string,
    amount: number,
    purpose: string,
    dueAt: Date,
  ) {
    const payoutAmount = Number(amount);
    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
      throw new BadRequestException('Payout amount must be greater than zero');
    }
    if (!(dueAt instanceof Date) || Number.isNaN(dueAt.getTime())) {
      throw new BadRequestException('Invalid dueAt date');
    }

    const creator = await this.usersRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    const payoutRef = `payout_${creatorId}_${randomUUID()}`;
    await this.walletService.debit(creatorId, payoutAmount, {
      purpose,
      type: 'payout',
      reference: payoutRef,
    });

    const payout = this.payoutRepository.create({
      creator: { id: creatorId } as any,
      amount: payoutAmount,
      currency: 'usd',
      status: 'pending',
      purpose,
      payoutId: payoutRef,
      dueAt,
    });
    const saved = await this.payoutRepository.save(payout);
    return this.serializePayout(saved, { mode: 'manual' });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async autoProcessDuePayouts(): Promise<void> {
    if (!this.connectEnabled) {
      return;
    }

    const due = await this.payoutRepository.find({
      where: { status: 'pending', dueAt: LessThanOrEqual(new Date()) },
      relations: ['creator'],
    });
    for (const payout of due) {
      if (!payout.creator?.stripeConnectAccountId || !payout.creator.payoutsEnabled) {
        this.logger.warn(
          `Skipped scheduled payout ${payout.id}: creator is not ready for Stripe Connect`,
        );
        continue;
      }
      try {
        const result = await this.approvePayout(payout.id);
        if (result.status === 'paid') {
          this.logger.log(
            `Auto-released scheduled payout ${payout.id} (${payout.amount} ${payout.currency})`,
          );
        } else {
          this.logger.warn(
            `Scheduled payout ${payout.id} ended in status ${result.status}`,
          );
        }
      } catch (err) {
        this.logger.warn(
          `Failed to auto-release payout ${payout.id}: ${(err as Error).message}`,
        );
      }
    }
  }

  async approvePayout(payoutId: string) {
    const payout = await this.claimPendingPayout(payoutId);
    if (!payout.creator?.id) {
      await this.updatePayoutFromStatus(payout.id, 'processing', { status: 'pending' });
      throw new NotFoundException('Payout creator not found');
    }

    const creator = payout.creator;
    const canTransfer =
      this.connectEnabled && !!creator.stripeConnectAccountId && !!creator.payoutsEnabled;
    if (canTransfer) {
      let transfer: any;
      try {
        transfer = await this.stripe.transfers.create({
          amount: Math.round(Number(payout.amount) * 100),
          currency: payout.currency,
          destination: creator.stripeConnectAccountId,
          metadata: { payoutId: payout.payoutId, creatorId: creator.id },
        });
      } catch (err: any) {
        await this.walletService.credit(creator.id, Number(payout.amount), {
          purpose: 'payout-transfer-failed',
          type: 'payout_reversal',
          reference: payout.payoutId,
        });
        const markedFailed = await this.updateProcessingPayout(payout.id, {
          status: 'failed',
          failureReason: err?.message ?? 'Stripe transfer failed',
          processedAt: new Date(),
        });
        if (!markedFailed) {
          return this.serializePayout(await this.getPayoutOrThrow(payout.id), { mode: 'stripe' });
        }
        const failed = await this.getPayoutOrThrow(payout.id);
        return this.serializePayout(failed, { mode: 'stripe' });
      }

      const settled = await this.updateProcessingPayout(payout.id, {
        status: 'paid',
        stripeTransferId: transfer.id,
        processedAt: new Date(),
      });
      if (!settled) {
        return this.serializePayout(await this.getPayoutOrThrow(payout.id), { mode: 'stripe' });
      }
      payout.status = 'paid';
      payout.stripeTransferId = transfer.id;
      payout.processedAt = new Date();
    } else {
      try {
        const settled = await this.updateProcessingPayout(payout.id, {
          status: 'paid',
          processedAt: new Date(),
        });
        if (!settled) {
          return this.serializePayout(await this.getPayoutOrThrow(payout.id), { mode: 'manual' });
        }
        payout.status = 'paid';
        payout.processedAt = new Date();
      } catch (err) {
        await this.payoutRepository.update(
          { id: payout.id, status: 'processing' },
          { status: 'pending' },
        );
        throw err;
      }
    }

    void this.webhooksService
      .dispatchEvent('payment.payout_completed', {
        payoutId: payout.id,
        payoutReference: payout.payoutId,
        creatorId: payout.creator?.id,
        amount: payout.amount,
        currency: payout.currency,
      })
      .catch((err) => {
        this.logger.warn(`Payout completion webhook failed: ${err?.message ?? err}`);
      });

    return this.serializePayout(payout, { mode: canTransfer ? 'stripe' : 'manual' });
  }

  async rejectPayout(payoutId: string, reason?: string) {
    const payout = await this.claimPendingPayout(payoutId);
    if (!payout.creator?.id) {
      await this.updatePayoutFromStatus(payout.id, 'processing', { status: 'pending' });
      throw new NotFoundException('Payout creator not found');
    }
    try {
      await this.walletService.credit(payout.creator.id, Number(payout.amount), {
        purpose: 'payout-rejected',
        type: 'payout_reversal',
        reference: payout.payoutId,
      });
    } catch (err) {
      await this.payoutRepository.update(
        { id: payout.id, status: 'processing' },
        { status: 'pending' },
      );
      throw err;
    }
    const settled = await this.updateProcessingPayout(payout.id, {
      status: 'rejected',
      failureReason: reason ?? 'Rejected by admin',
      processedAt: new Date(),
    });
    if (!settled) {
      return this.serializePayout(await this.getPayoutOrThrow(payout.id), { mode: 'manual' });
    }
    payout.status = 'rejected';
    payout.failureReason = reason ?? 'Rejected by admin';
    payout.processedAt = new Date();
    return this.serializePayout(payout, { mode: 'manual' });
  }

  private async claimPendingPayout(payoutId: string): Promise<Payout> {
    const result = await this.payoutRepository.update(
      { id: payoutId, status: 'pending' },
      { status: 'processing' },
    );
    if (result?.affected !== 1) {
      const current = await this.getPayoutOrThrow(payoutId);
      throw new BadRequestException(`Payout is not pending (status: ${current.status})`);
    }
    return this.getPayoutOrThrow(payoutId);
  }

  private async updatePayoutFromStatus(
    payoutId: string,
    fromStatus: Payout['status'],
    patch: Record<string, any>,
  ): Promise<boolean> {
    const result = await this.payoutRepository.update(
      { id: payoutId, status: fromStatus },
      patch,
    );
    return result?.affected === 1;
  }

  private async updateProcessingPayout(
    payoutId: string,
    patch: Record<string, any>,
  ): Promise<boolean> {
    return this.updatePayoutFromStatus(payoutId, 'processing', patch);
  }

  private async getPayoutOrThrow(payoutId: string): Promise<Payout> {
    const payout = await this.payoutRepository.findOne({
      where: { id: payoutId },
      relations: ['creator'],
    });
    if (!payout) {
      throw new NotFoundException('Payout not found');
    }
    return payout;
  }

  private serializePayout(payout: Payout, extra: Record<string, any> = {}) {
    return {
      success: payout.status !== 'failed' && payout.status !== 'rejected',
      status: payout.status,
      creatorId: payout.creator?.id,
      amount: Number(payout.amount),
      currency: payout.currency,
      purpose: payout.purpose,
      payoutId: payout.payoutId,
      failureReason: payout.failureReason,
      ...extra,
    };
  }

  /**
   * Verify a Stripe webhook payload against STRIPE_WEBHOOK_SECRET and return
   * the parsed event. Throws if payments/webhooks are not configured or the
   * signature is invalid.
   */
  constructWebhookEvent(rawBody: Buffer, signature: string): any {
    this.assertPaymentsEnabled();
    if (!this.webhookSecret) {
      throw new ServiceUnavailableException(
        'Stripe webhooks are not configured. Set STRIPE_WEBHOOK_SECRET to enable them.',
      );
    }
    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Invalid Stripe webhook signature: ${err.message}`);
    }
  }

  async handleWebhookEvent(event: any): Promise<{ received: true; handled: boolean }> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.confirmPaymentSucceeded(event.data.object);
        return { received: true, handled: true };
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        await this.markPaymentFailed(event.data.object, event.type);
        return { received: true, handled: true };
      case 'transfer.paid':
        await this.markPayoutPaid(event.data.object);
        return { received: true, handled: true };
      case 'transfer.failed':
        await this.reversePayout(event.data.object);
        return { received: true, handled: true };
      case 'account.updated':
        await this.syncConnectAccount(event.data.object);
        return { received: true, handled: true };
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object);
        return { received: true, handled: true };
      default:
        // Acknowledge unhandled event types so Stripe stops retrying them.
        return { received: true, handled: false };
    }
  }

  /**
   * A charge was fully or partially refunded. Reverse the wallet credits
   * exactly once (recipient net + platform fee) and mark the transaction.
   * Replaying the same event is a no-op once status is 'refunded'.
   */
  private async handleChargeRefunded(charge: any): Promise<void> {
    const paymentIntentId =
      typeof charge?.payment_intent === 'string'
        ? charge.payment_intent
        : charge?.payment_intent?.id;
    if (!paymentIntentId) return;

    const transaction = await this.paymentRepository.findOne({
      where: { paymentId: paymentIntentId },
    });
    if (!transaction || transaction.status === 'refunded' || transaction.status === 'canceled') {
      return;
    }

    const gross = Number(transaction.amount);
    if (charge.amount_refunded != null && charge.amount_refunded <= 0) {
      return;
    }
    const refundedGross = Math.min(
      gross,
      charge.amount_refunded != null && charge.amount_refunded > 0
        ? Math.round((charge.amount_refunded / 100) * 100) / 100
        : gross,
    );
    const previousRefunded = Number(transaction.metadata?.refundedGross ?? 0);
    const refundDelta = Math.max(0, refundedGross - previousRefunded);
    if (refundDelta <= 0) return;

    const hasRecipientCredit = Object.prototype.hasOwnProperty.call(
      transaction.metadata ?? {},
      'recipientCredited',
    );
    const recipient = transaction.recipient?.id;
    const feeRate = Number(transaction.metadata?.platformFeeRate ?? DEFAULT_PLATFORM_FEE_RATE);
    const split = splitRevenue(gross, feeRate);
    const scale = gross > 0 ? refundDelta / gross : 1;
    const recipientBack = Math.round(split.recipientAmount * scale * 100) / 100;
    const platformBack = Math.round(split.platformFee * scale * 100) / 100;

    if (hasRecipientCredit && recipient) {
      if (recipientBack > 0) {
        await this.walletService.debit(recipient, recipientBack, {
          purpose: 'refund',
          type: 'adjustment',
          reference: transaction.paymentId,
          metadata: { chargeId: charge.id, refundedGross },
        });
      }
      if (platformBack > 0) {
        await this.walletService.debit(PLATFORM_USER_ID, platformBack, {
          purpose: 'platform-fee-refund',
          type: 'adjustment',
          reference: transaction.paymentId,
          metadata: { chargeId: charge.id, refundedGross },
        });
      }
    }

    transaction.status = refundedGross >= gross ? 'refunded' : 'partially_refunded';
    transaction.metadata = {
      ...transaction.metadata,
      refundedAt: new Date().toISOString(),
      refundedGross,
      recipientReversed: Number(transaction.metadata?.recipientReversed ?? 0) + recipientBack,
      platformReversed: Number(transaction.metadata?.platformReversed ?? 0) + platformBack,
    };
    await this.paymentRepository.save(transaction);
  }

  /** Finalize a payout whose Stripe transfer has settled. Idempotent. */
  private async markPayoutPaid(transfer: any): Promise<void> {
    const payout = await this.findPayoutByTransfer(transfer);
    if (
      !payout ||
      payout.status === 'paid' ||
      payout.status === 'failed' ||
      payout.status === 'reversing'
    ) {
      return;
    }
    await this.updatePayoutFromStatus(payout.id, payout.status, {
      status: 'paid',
      processedAt: new Date(),
    });
  }

  /**
   * A previously-booked transfer failed at Stripe. Refund the creator's wallet
   * exactly once and mark the payout failed.
   */
  private async reversePayout(transfer: any): Promise<void> {
    const payout = await this.findPayoutByTransfer(transfer);
    if (
      !payout ||
      payout.status === 'failed' ||
      payout.status === 'rejected' ||
      payout.status === 'reversing'
    ) {
      return;
    }
    if (!payout.creator?.id) {
      await this.updatePayoutFromStatus(payout.id, payout.status, {
        status: 'failed',
        failureReason: 'Payout creator not found',
        processedAt: new Date(),
      });
      return;
    }
    const claimed = await this.updatePayoutFromStatus(payout.id, payout.status, {
      status: 'reversing',
    });
    if (!claimed) return;
    try {
      await this.walletService.credit(payout.creator.id, Number(payout.amount), {
        purpose: 'payout-transfer-failed',
        type: 'payout_reversal',
        reference: payout.payoutId,
      });
    } catch (err) {
      await this.updatePayoutFromStatus(payout.id, 'reversing', { status: payout.status });
      throw err;
    }
    await this.updatePayoutFromStatus(payout.id, 'reversing', {
      status: 'failed',
      failureReason: transfer?.failure_message ?? 'Stripe transfer failed',
      processedAt: new Date(),
    });
  }

  private async findPayoutByTransfer(transfer: any): Promise<Payout | null> {
    if (transfer?.id) {
      const byId = await this.payoutRepository.findOne({
        where: { stripeTransferId: transfer.id },
        relations: ['creator'],
      });
      if (byId) return byId;
    }
    // Fall back to the payoutId we stamped into the transfer metadata.
    const payoutId = transfer?.metadata?.payoutId;
    if (payoutId) {
      return this.payoutRepository.findOne({
        where: { payoutId },
        relations: ['creator'],
      });
    }
    return null;
  }

  /** Keep the cached payoutsEnabled flag in sync when Connect onboarding completes. */
  private async syncConnectAccount(account: any): Promise<void> {
    if (!account?.id) return;
    const user = await this.usersRepository.findOne({
      where: { stripeConnectAccountId: account.id },
    });
    if (!user) return;
    const payoutsEnabled = !!account.payouts_enabled;
    if (user.payoutsEnabled !== payoutsEnabled) {
      user.payoutsEnabled = payoutsEnabled;
      await this.usersRepository.save(user);
    }
  }

  /**
   * Idempotently confirm a payment: flip the transaction to 'succeeded' and
   * credit the recipient's wallet exactly once.
   */
  private async confirmPaymentSucceeded(
    paymentIntent: any,
    existingTransaction?: PaymentTransaction,
  ): Promise<boolean> {
    const transaction =
      existingTransaction ??
      (await this.paymentRepository.findOne({
        where: { paymentId: paymentIntent.id },
      }));
    if (
      !transaction ||
      transaction.status === 'refunded' ||
      transaction.status === 'partially_refunded'
    ) {
      return false;
    }

    if (transaction.status !== 'succeeded') {
      transaction.status = 'succeeded';
      transaction.metadata = {
        ...transaction.metadata,
        confirmedByWebhookAt: new Date().toISOString(),
      };
      await this.paymentRepository.save(transaction);
    }

    const hasRecipientCredit = Object.prototype.hasOwnProperty.call(
      transaction.metadata ?? {},
      'recipientCredited',
    );
    const amount = Number(transaction.amount);
    if (!hasRecipientCredit && transaction.recipient?.id && amount > 0) {
      const feeRate = Number(
        transaction.metadata?.platformFeeRate ?? DEFAULT_PLATFORM_FEE_RATE,
      );
      await this.creditRecipientWithSplit(transaction, feeRate);
    }

    return this.fulfillPayment(transaction);
  }

  private async markPaymentFailed(paymentIntent: any, eventType: string): Promise<void> {
    const transaction = await this.paymentRepository.findOne({
      where: { paymentId: paymentIntent.id },
    });
    // Never regress a succeeded transaction — Stripe can deliver events out of order.
    if (
      !transaction ||
      transaction.status === 'succeeded' ||
      transaction.status === 'refunded' ||
      transaction.status === 'partially_refunded'
    ) {
      return;
    }

    transaction.status = eventType === 'payment_intent.canceled' ? 'canceled' : 'failed';
    transaction.metadata = {
      ...transaction.metadata,
      failureEvent: eventType,
      failureMessage: paymentIntent.last_payment_error?.message ?? null,
    };
    await this.paymentRepository.save(transaction);
  }

  // ---- Reconciliation API (Phase 2) --------------------------------------

  /** Report whether Stripe Connect payouts are active (gate for the job). */
  get isConnectEnabled(): boolean {
    return this.connectEnabled;
  }

  /**
   * Reconcile ONE local payout against its Stripe transfer. Replay-safe: it
   * partners with the transfer.paid / transfer.failed webhooks, and both paths
   * are idempotent. Only 'processing' (or stale 'paid' awaiting confirmation)
   * payouts with a known transfer are touched.
   */
  async syncPayoutWithStripe(
    payout: Payout,
  ): Promise<{ outcome: 'paid' | 'failed' | 'unchanged'; reason?: string }> {
    if (!this.stripe || !this.connectEnabled) {
      return { outcome: 'unchanged', reason: 'payments-disabled' };
    }
    const transferId = payout.stripeTransferId;
    if (!transferId) {
      return { outcome: 'unchanged', reason: 'no-stripe-transfer-id' };
    }
    if (payout.status !== 'processing' && payout.status !== 'paid') {
      return { outcome: 'unchanged', reason: `status-${payout.status}` };
    }

    let transfer: any;
    try {
      transfer = await this.stripe.transfers.retrieve(transferId);
    } catch (err: any) {
      this.logger.warn(`Reconciliation could not retrieve transfer ${transferId}: ${err?.message}`);
      return { outcome: 'unchanged', reason: `retrieve-failed: ${err?.message ?? 'unknown'}` };
    }

    if (transfer?.status === 'paid') {
      await this.markPayoutPaid(transfer);
      return { outcome: 'paid' };
    }
    if (transfer?.status === 'failed') {
      await this.reversePayout(transfer);
      return { outcome: 'failed' };
    }
    return { outcome: 'unchanged', reason: `stripe-status-${transfer?.status ?? 'unknown'}` };
  }

  /**
   * Fallback lookup for orphaned payouts: find a Stripe transfer by the
   * payoutId stamped into its metadata. Covers a crash between creating the
   * transfer and persisting stripeTransferId on the local payout.
   */
  async locateTransferByPayoutId(payoutId: string, sinceHours = 24): Promise<any | null> {
    if (!this.stripe || !this.connectEnabled) return null;
    const since = Math.floor((Date.now() - sinceHours * 3600_000) / 1000);
    try {
      const list = await this.stripe.transfers.list({
        limit: 100,
        created: { gte: since },
      });
      return list?.data?.find((t: any) => t?.metadata?.payoutId === payoutId) ?? null;
    } catch (err: any) {
      this.logger.warn(`Reconciliation transfer lookup failed: ${err?.message}`);
      return null;
    }
  }

  /** Informational Stripe balance snapshot for drift checking (cents). */
  async getStripeBalanceSnapshot(): Promise<{ available: number; pending: number } | null> {
    if (!this.stripe) return null;
    try {
      const balance = await this.stripe.balance.retrieve();
      const net = (entries?: any[]) =>
        (entries ?? []).reduce((sum, entry: any) => sum + Number(entry?.amount ?? 0), 0);
      return {
        available: net(balance?.available),
        pending: net(balance?.pending),
      };
    } catch (err: any) {
      this.logger.warn(`Stripe balance snapshot failed: ${err?.message}`);
      return null;
    }
  }
}
