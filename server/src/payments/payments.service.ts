import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Payout } from './entities/payout.entity';
import { User } from '../users/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');

@Injectable()
export class PaymentsService {
  private readonly stripe: any;
  private readonly paymentsEnabled: boolean;
  /** Stripe Connect payouts require both payments and a usable Stripe client. */
  private readonly connectEnabled: boolean;
  private readonly webhookSecret: string | undefined;
  private readonly clientUrl: string;

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly paymentRepository: Repository<PaymentTransaction>,
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.paymentsEnabled =
      this.configService.get<string>('PAYMENTS_ENABLED') === 'true' && !!stripeKey;
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    this.clientUrl =
      this.configService.get<string>('CLIENT_URL') || 'http://127.0.0.1:5173';

    this.stripe = stripeKey
      ? new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' })
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

  async createPaymentIntent(amount: number, currency: string): Promise<any> {
    this.assertPaymentsEnabled();
    // Let Stripe errors propagate — a failed intent must never look like a success.
    return this.stripe.paymentIntents.create({
      amount,
      currency,
    });
  }

  async processPayment(userId: string, amount: number, purpose: string, options: { currency?: string; metadata?: Record<string, any>; payerId?: string; recipientId?: string } = {}) {
    this.assertPaymentsEnabled();
    const currency = options.currency || 'usd';
    const paymentIntent = await this.createPaymentIntent(Math.round(amount * 100), currency);

    const transaction = this.paymentRepository.create({
      provider: 'stripe',
      status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'requires_payment_method',
      paymentId: paymentIntent.id,
      purpose,
      amount,
      currency,
      metadata: { ...options.metadata, paymentIntent },
      payer: options.payerId ? ({ id: options.payerId } as any) : null,
      recipient: options.recipientId ? ({ id: options.recipientId } as any) : null,
    });

    await this.paymentRepository.save(transaction);

    // Only move money on a confirmed payment. A newly created intent is almost
    // never 'succeeded' — confirmation normally arrives asynchronously via the
    // Stripe webhook (payment_intent.succeeded → confirmPaymentSucceeded).
    if (paymentIntent.status === 'succeeded' && options.recipientId && amount > 0) {
      await this.walletService.credit(options.recipientId, amount, { purpose });
    }

    return {
      success: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
      userId,
      amount,
      purpose,
      paymentId: transaction.paymentId,
      currency,
    };
  }

  async createDemoPaymentScenario(amount: number, currency = 'usd', recipientId: string, payerId: string) {
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
    const payoutRef = `payout_${creatorId}_${await this.nextPayoutSuffix()}`;
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
    try {
      payout.status = 'processing';
      await this.payoutRepository.save(payout);

      const transfer = await this.stripe.transfers.create({
        amount: Math.round(payoutAmount * 100),
        currency: payout.currency,
        destination: creator.stripeConnectAccountId,
        metadata: { payoutId: payout.payoutId, creatorId },
      });

      payout.stripeTransferId = transfer.id;
      // transfers.create resolves once the transfer is booked; treat it as paid
      // and let transfer.failed webhooks reverse it if it later bounces.
      payout.status = 'paid';
      payout.processedAt = new Date();
      await this.payoutRepository.save(payout);

      return this.serializePayout(payout, { mode: 'stripe' });
    } catch (err: any) {
      // Refund the wallet — the money never left, so the debit must be undone.
      await this.walletService.credit(creatorId, payoutAmount, {
        purpose: 'payout-reversal',
        type: 'payout_reversal',
        reference: payout.payoutId,
      });
      payout.status = 'failed';
      payout.failureReason = err?.message ?? 'Stripe transfer failed';
      await this.payoutRepository.save(payout);

      return this.serializePayout(payout, { mode: 'stripe' });
    }
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
    return this.payoutRepository.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
    });
  }

  async approvePayout(payoutId: string) {
    const payout = await this.getPayoutOrThrow(payoutId);
    if (payout.status !== 'pending') {
      throw new BadRequestException(`Payout is not pending (status: ${payout.status})`);
    }
    payout.status = 'paid';
    payout.processedAt = new Date();
    await this.payoutRepository.save(payout);
    return this.serializePayout(payout, { mode: 'manual' });
  }

  async rejectPayout(payoutId: string, reason?: string) {
    const payout = await this.getPayoutOrThrow(payoutId);
    if (payout.status !== 'pending') {
      throw new BadRequestException(`Payout is not pending (status: ${payout.status})`);
    }
    // Refund the wallet — the creator never received these funds.
    await this.walletService.credit(payout.creator.id, Number(payout.amount), {
      purpose: 'payout-rejected',
      type: 'payout_reversal',
      reference: payout.payoutId,
    });
    payout.status = 'rejected';
    payout.failureReason = reason ?? 'Rejected by admin';
    payout.processedAt = new Date();
    await this.payoutRepository.save(payout);
    return this.serializePayout(payout, { mode: 'manual' });
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

  /** Monotonic-ish suffix for a human-readable payout reference. */
  private async nextPayoutSuffix(): Promise<number> {
    const count = await this.payoutRepository.count();
    return count + 1;
  }

  private serializePayout(payout: Payout, extra: Record<string, any> = {}) {
    return {
      success: payout.status !== 'failed',
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
      default:
        // Acknowledge unhandled event types so Stripe stops retrying them.
        return { received: true, handled: false };
    }
  }

  /** Finalize a payout whose Stripe transfer has settled. Idempotent. */
  private async markPayoutPaid(transfer: any): Promise<void> {
    const payout = await this.findPayoutByTransfer(transfer);
    if (!payout || payout.status === 'paid' || payout.status === 'failed') {
      return;
    }
    payout.status = 'paid';
    payout.processedAt = new Date();
    await this.payoutRepository.save(payout);
  }

  /**
   * A previously-booked transfer failed at Stripe. Refund the creator's wallet
   * exactly once and mark the payout failed.
   */
  private async reversePayout(transfer: any): Promise<void> {
    const payout = await this.findPayoutByTransfer(transfer);
    if (!payout || payout.status === 'failed' || payout.status === 'rejected') {
      return;
    }
    await this.walletService.credit(payout.creator.id, Number(payout.amount), {
      purpose: 'payout-transfer-failed',
      type: 'payout_reversal',
      reference: payout.payoutId,
    });
    payout.status = 'failed';
    payout.failureReason = transfer?.failure_message ?? 'Stripe transfer failed';
    payout.processedAt = new Date();
    await this.payoutRepository.save(payout);
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
  private async confirmPaymentSucceeded(paymentIntent: any): Promise<void> {
    const transaction = await this.paymentRepository.findOne({
      where: { paymentId: paymentIntent.id },
    });
    if (!transaction || transaction.status === 'succeeded') {
      return;
    }

    transaction.status = 'succeeded';
    transaction.metadata = {
      ...transaction.metadata,
      confirmedByWebhookAt: new Date().toISOString(),
    };
    await this.paymentRepository.save(transaction);

    const amount = Number(transaction.amount);
    if (transaction.recipient?.id && amount > 0) {
      await this.walletService.credit(transaction.recipient.id, amount, {
        purpose: transaction.purpose ?? 'payment',
        type: 'earning',
        reference: transaction.paymentId,
      });
    }
  }

  private async markPaymentFailed(paymentIntent: any, eventType: string): Promise<void> {
    const transaction = await this.paymentRepository.findOne({
      where: { paymentId: paymentIntent.id },
    });
    // Never regress a succeeded transaction — Stripe can deliver events out of order.
    if (!transaction || transaction.status === 'succeeded') {
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
}
