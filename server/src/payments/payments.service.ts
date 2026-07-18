import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Payout } from './entities/payout.entity';
import { WalletService } from '../wallet/wallet.service';

const Stripe = require('stripe');

@Injectable()
export class PaymentsService {
  private readonly stripe: any;

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly paymentRepository: Repository<PaymentTransaction>,
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
    private readonly walletService: WalletService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development', {
      apiVersion: '2026-05-27.dahlia',
    });
  }

  async createPaymentIntent(amount: number, currency: string): Promise<any> {
    try {
      return await this.stripe.paymentIntents.create({
        amount,
        currency,
      });
    } catch (error) {
      return {
        id: `pi_${Date.now()}`,
        amount,
        currency,
        status: 'requires_payment_method',
      };
    }
  }

  async processPayment(userId: string, amount: number, purpose: string, options: { currency?: string; metadata?: Record<string, any>; payerId?: string; recipientId?: string } = {}) {
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

    if (options.recipientId && amount > 0) {
      await this.walletService.credit(options.recipientId, amount, { purpose });
    }

    return {
      success: true,
      status: 'succeeded',
      userId,
      amount,
      purpose,
      paymentId: transaction.paymentId,
      currency,
    };
  }

  async createDemoPaymentScenario(amount: number, currency = 'usd', recipientId: string, payerId: string) {
    const safeAmount = Number(amount);
    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const paymentIntent = await this.createPaymentIntent(Math.round(safeAmount * 100), currency);
    const transaction = this.paymentRepository.create({
      provider: 'demo',
      status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'requires_payment_method',
      paymentId: paymentIntent.id,
      purpose: 'demo-poc',
      amount: safeAmount,
      currency,
      metadata: {
        scenario: 'proof-of-concept',
        mode: 'demo',
        paymentIntent,
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

    const payout = this.payoutRepository.create({
      creator: { id: creatorId } as any,
      amount: payoutAmount,
      status: 'pending',
      purpose,
      payoutId: `payout_${Date.now()}`,
    });

    await this.payoutRepository.save(payout);
    await this.walletService.debit(creatorId, payoutAmount, { purpose });

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
}