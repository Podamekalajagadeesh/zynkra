import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Payout } from './entities/payout.entity';
import { WalletService } from '../wallet/wallet.service';

const Stripe = require('stripe');

@Injectable()
export class PaymentsService {
  private readonly stripe: any;
  private readonly paymentsEnabled: boolean;
  private readonly webhookSecret: string | undefined;

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly paymentRepository: Repository<PaymentTransaction>,
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.paymentsEnabled =
      this.configService.get<string>('PAYMENTS_ENABLED') === 'true' && !!stripeKey;
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    this.stripe = stripeKey
      ? new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' })
      : null;
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

    // Debit first — if the creator lacks funds this throws and no payout row is created.
    await this.walletService.debit(creatorId, payoutAmount, { purpose });

    const payout = this.payoutRepository.create({
      creator: { id: creatorId } as any,
      amount: payoutAmount,
      status: 'pending',
      purpose,
      payoutId: `payout_${Date.now()}`,
    });

    await this.payoutRepository.save(payout);

    return {
      success: true,
      status: 'pending',
      creatorId,
      amount: payoutAmount,
      purpose,
      payoutId: payout.payoutId,
    };
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
      default:
        // Acknowledge unhandled event types so Stripe stops retrying them.
        return { received: true, handled: false };
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
        paymentId: transaction.paymentId,
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
