import { PaymentsService } from '../src/payments/payments.service';
import { PLATFORM_USER_ID } from '../src/payments/revenue-split';

/**
 * Phase 2 money-path: webhook replay + refund against production PaymentsService
 * (mocked repositories/WalletService — exercises real split + idempotency logic).
 */
describe('PaymentsService webhooks (replay + refund)', () => {
  function buildHarness() {
    const transactions = new Map<string, any>();
    const credits: Array<{ userId: string; amount: number; options: any }> = [];
    const debits: Array<{ userId: string; amount: number; options: any }> = [];

    const paymentRepository = {
      create: jest.fn((data: any) => ({ ...data })),
      save: jest.fn(async (txn: any) => {
        if (txn.paymentId) transactions.set(txn.paymentId, txn);
        return txn;
      }),
      findOne: jest.fn(async ({ where }: any) => transactions.get(where.paymentId) ?? null),
      find: jest.fn(async () => [...transactions.values()]),
      count: jest.fn(async () => transactions.size),
    };

    const payouts: any[] = [];
    const payoutRepository = {
      create: jest.fn((data: any) => ({ ...data })),
      save: jest.fn(async (p: any) => {
        if (!p.id) p.id = `po-${payouts.length + 1}`;
        const idx = payouts.findIndex((x) => x.id === p.id);
        if (idx >= 0) payouts[idx] = p;
        else payouts.push(p);
        return p;
      }),
      findOne: jest.fn(
        async ({ where }: any) =>
          payouts.find(
            (p) =>
              p.id === where.id ||
              p.payoutId === where.payoutId ||
              (where.stripeTransferId && p.stripeTransferId === where.stripeTransferId)
          ) ?? null
      ),
      find: jest.fn(async () => payouts),
      count: jest.fn(async () => payouts.length),
      update: jest.fn(async (criteria: any, patch: any) => {
        const payout = payouts.find(
          (p) =>
            p.id === criteria.id && (criteria.status === undefined || p.status === criteria.status)
        );
        if (!payout) return { affected: 0 };
        Object.assign(payout, patch);
        return { affected: 1 };
      }),
    };

    const usersRepository = {
      findOne: jest.fn(async ({ where }: any) =>
        where?.id ? { id: where.id, walletBalance: 100 } : null
      ),
      save: jest.fn(async (u: any) => u),
    };

    const walletService = {
      credit: jest.fn(async (userId: string, amount: number, options: any = {}) => {
        credits.push({ userId, amount, options });
        return { walletBalance: 100 + amount };
      }),
      debit: jest.fn(async (userId: string, amount: number, options: any = {}) => {
        debits.push({ userId, amount, options });
        return { walletBalance: 100 - amount };
      }),
    };

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'PAYMENTS_ENABLED') return 'true';
        if (key === 'STRIPE_SECRET_KEY') return 'sk_test_dummy';
        if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_dummy';
        if (key === 'STRIPE_CONNECT_ENABLED') return 'false';
        return undefined;
      }),
    };

    const webhooksService = { dispatchEvent: jest.fn(async () => undefined) };

    const service = new PaymentsService(
      paymentRepository as any,
      payoutRepository as any,
      usersRepository as any,
      walletService as any,
      configService as any,
      webhooksService as any
    );

    const seedPayment = async (
      paymentId: string,
      amount = 100,
      status = 'requires_payment_method'
    ) => {
      const txn = {
        provider: 'stripe',
        status,
        paymentId,
        purpose: 'tip',
        amount,
        currency: 'usd',
        metadata: { platformFeeRate: 0.1, type: 'tip' },
        payer: { id: 'fan-1' },
        recipient: { id: 'creator-1' },
      };
      await paymentRepository.save(txn);
      return txn;
    };

    return {
      service,
      credits,
      debits,
      transactions,
      walletService,
      paymentRepository,
      payouts,
      seedPayment,
    };
  }

  it('payment_intent.succeeded credits 90/10 once even if the webhook is replayed', async () => {
    const h = buildHarness();
    await h.seedPayment('pi_123', 100);

    const event = {
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } },
    };

    const first = await h.service.handleWebhookEvent(event);
    const second = await h.service.handleWebhookEvent(event);

    expect(first).toEqual({ received: true, handled: true });
    expect(second).toEqual({ received: true, handled: true });

    const toCreator = h.credits.filter((c) => c.userId === 'creator-1');
    const toPlatform = h.credits.filter((c) => c.userId === PLATFORM_USER_ID);
    expect(toCreator).toHaveLength(1);
    expect(toPlatform).toHaveLength(1);
    expect(toCreator[0].amount).toBe(90);
    expect(toPlatform[0].amount).toBe(10);
    expect(toPlatform[0].options.purpose).toBe('platform-fee');
  });

  it('fulfills a resource only after success and only once', async () => {
    const h = buildHarness();
    const handler = jest.fn(async () => undefined);
    h.service.registerFulfillmentHandler('subscription', handler);
    await h.seedPayment('pi_subscription', 10);
    h.transactions.get('pi_subscription').metadata.fulfillmentType = 'subscription';

    const event = {
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_subscription' } },
    };
    await h.service.handleWebhookEvent(event);
    await h.service.handleWebhookEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(h.transactions.get('pi_subscription').metadata.fulfillmentStatus).toBe('completed');
  });

  it('does not fulfill a resource when payment fails', async () => {
    const h = buildHarness();
    const handler = jest.fn(async () => undefined);
    h.service.registerFulfillmentHandler('tip', handler);
    await h.seedPayment('pi_failed', 10);
    h.transactions.get('pi_failed').metadata.fulfillmentType = 'tip';

    await h.service.handleWebhookEvent({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_failed' } },
    });

    expect(handler).not.toHaveBeenCalled();
    expect(h.transactions.get('pi_failed').status).toBe('failed');
  });

  it('charge.refunded reverses recipient + platform credits once (replay-safe)', async () => {
    const h = buildHarness();
    await h.seedPayment('pi_refund', 50, 'succeeded');
    h.transactions.get('pi_refund').metadata.recipientCredited = 45;
    h.transactions.get('pi_refund').metadata.platformCredited = 5;

    const event = {
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_1',
          payment_intent: 'pi_refund',
          amount_refunded: 5000, // cents → $50
        },
      },
    };

    await h.service.handleWebhookEvent(event);
    await h.service.handleWebhookEvent(event); // replay

    const creatorDebits = h.debits.filter((d) => d.userId === 'creator-1');
    const platformDebits = h.debits.filter((d) => d.userId === PLATFORM_USER_ID);
    expect(creatorDebits).toHaveLength(1);
    expect(platformDebits).toHaveLength(1);
    expect(creatorDebits[0].amount).toBeCloseTo(45, 2);
    expect(platformDebits[0].amount).toBeCloseTo(5, 2);
    expect(creatorDebits[0].options.type).toBe('adjustment');
    expect(creatorDebits[0].options.purpose).toBe('refund');

    const txn = h.transactions.get('pi_refund');
    expect(txn.status).toBe('refunded');
  });

  it('processes successive partial refunds without dropping the remainder', async () => {
    const h = buildHarness();
    await h.seedPayment('pi_partial', 100, 'succeeded');
    h.transactions.get('pi_partial').metadata.recipientCredited = 90;
    h.transactions.get('pi_partial').metadata.platformCredited = 10;

    await h.service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_partial', payment_intent: 'pi_partial', amount_refunded: 4000 } },
    });
    await h.service.handleWebhookEvent({
      type: 'charge.refunded',
      data: {
        object: { id: 'ch_partial_2', payment_intent: 'pi_partial', amount_refunded: 10000 },
      },
    });

    const creatorDebits = h.debits.filter((d) => d.userId === 'creator-1');
    const platformDebits = h.debits.filter((d) => d.userId === PLATFORM_USER_ID);
    expect(creatorDebits).toHaveLength(2);
    expect(platformDebits).toHaveLength(2);
    expect(creatorDebits[0].amount).toBeCloseTo(36, 2);
    expect(creatorDebits[1].amount).toBeCloseTo(54, 2);
    expect(h.transactions.get('pi_partial').status).toBe('refunded');
  });

  it('does not reverse a refund for a payment that was never credited', async () => {
    const h = buildHarness();
    await h.seedPayment('pi_uncredited', 50, 'succeeded');

    await h.service.handleWebhookEvent({
      type: 'charge.refunded',
      data: {
        object: { id: 'ch_uncredited', payment_intent: 'pi_uncredited', amount_refunded: 5000 },
      },
    });

    expect(h.debits).toHaveLength(0);
    expect(h.transactions.get('pi_uncredited').status).toBe('refunded');
  });

  it('payment_intent.payment_failed does not credit and does not regress succeeded', async () => {
    const h = buildHarness();
    await h.seedPayment('pi_ok', 10, 'succeeded');

    await h.service.handleWebhookEvent({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_ok', last_payment_error: { message: 'card_declined' } } },
    });

    expect(h.credits).toHaveLength(0);
    expect(h.transactions.get('pi_ok').status).toBe('succeeded');
  });

  it('finalizes a transfer payout once and reverses a failed transfer once', async () => {
    const h = buildHarness();
    const paidPayout = {
      id: 'po-paid',
      status: 'processing',
      stripeTransferId: 'tr_paid',
      payoutId: 'payout_paid',
      amount: 20,
      creator: { id: 'creator-1' },
    };
    const failedPayout = {
      id: 'po-failed',
      status: 'paid',
      stripeTransferId: 'tr_failed',
      payoutId: 'payout_failed',
      amount: 30,
      creator: { id: 'creator-1' },
    };
    h.payouts.push(paidPayout, failedPayout);

    await h.service.handleWebhookEvent({
      type: 'transfer.paid',
      data: { object: { id: 'tr_paid' } },
    });
    await h.service.handleWebhookEvent({
      type: 'transfer.paid',
      data: { object: { id: 'tr_paid' } },
    });
    await h.service.handleWebhookEvent({
      type: 'transfer.failed',
      data: { object: { id: 'tr_failed', failure_message: 'declined' } },
    });
    await h.service.handleWebhookEvent({
      type: 'transfer.failed',
      data: { object: { id: 'tr_failed', failure_message: 'declined' } },
    });

    expect(paidPayout.status).toBe('paid');
    expect(failedPayout.status).toBe('failed');
    expect(h.credits.filter((credit) => credit.userId === 'creator-1')).toHaveLength(1);
    expect(h.credits[0].amount).toBe(30);
  });

  it('unknown event types are acknowledged but unhandled', async () => {
    const h = buildHarness();
    const result = await h.service.handleWebhookEvent({
      type: 'invoice.created',
      data: { object: {} },
    });
    expect(result).toEqual({ received: true, handled: false });
  });
});
