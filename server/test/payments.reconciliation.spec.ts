import { PaymentsService } from '../src/payments/payments.service';
import { PayoutReconciliationService } from '../src/payments/reconciliation.service';

/**
 * Phase 2 money-path: payout reconciliation against Stripe transfer state,
 * driving 'processing' payouts to paid/failed (replay-safe partner of the
 * transfer.paid / transfer.failed webhooks).
 */
describe('PayoutReconciliationService', () => {
  function buildHarness(connectEnabled = true) {
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
      update: jest.fn(async (criteria: any, patch: any) => {
        const payout = payouts.find(
          (p) =>
            p.id === criteria.id &&
            (criteria.status === undefined || p.status === criteria.status),
        );
        if (!payout) return { affected: 0 };
        Object.assign(payout, patch);
        return { affected: 1 };
      }),
      findOne: jest.fn(async ({ where }: any) =>
        payouts.find(
          (p) =>
            p.id === where.id ||
            p.payoutId === where.payoutId ||
            (where.stripeTransferId && p.stripeTransferId === where.stripeTransferId),
        ) ?? null,
      ),
      find: jest.fn(async () => payouts),
      count: jest.fn(async () => payouts.length),
    };

    const transfers = new Map<string, any>();
    const walletCredits: Array<{ userId: string; amount: number; options: any }> = [];

    const stripe = {
      transfers: {
        retrieve: jest.fn(async (id: string) => transfers.get(id) ?? null),
        list: jest.fn(async () => ({
          data: [...transfers.values()].map((t) => ({
            id: t.id,
            metadata: t.metadata,
          })),
        })),
      },
      balance: {
        retrieve: jest.fn(async () => ({
          available: [{ amount: 12345, currency: 'usd' }],
          pending: [{ amount: 0, currency: 'usd' }],
        })),
      },
    };

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'PAYMENTS_ENABLED') return 'true';
        if (key === 'STRIPE_SECRET_KEY') return 'sk_test_dummy';
        if (key === 'STRIPE_CONNECT_ENABLED') return String(connectEnabled);
        return undefined;
      }),
    };

    const paymentsService = new PaymentsService(
      {
        create: jest.fn(),
        save: jest.fn(async (t: any) => t),
        findOne: jest.fn(async () => null),
        find: jest.fn(async () => []),
        count: jest.fn(async () => 0),
      } as any,
      payoutRepository as any,
      { findOne: jest.fn(async () => null), save: jest.fn(async (u: any) => u) } as any,
      {
        credit: jest.fn(async (userId: string, amount: number, options: any = {}) => {
          walletCredits.push({ userId, amount, options });
          return { walletBalance: 100 + amount };
        }),
        debit: jest.fn(async () => ({ walletBalance: 0 })),
      } as any,
      configService as any,
      { dispatchEvent: jest.fn(async () => undefined) } as any,
    );
    (paymentsService as any).stripe = stripe;
    (paymentsService as any).logger = { log: jest.fn(), warn: jest.fn(), debug: jest.fn() };

    const service = new PayoutReconciliationService(payoutRepository as any, paymentsService);

    const seedProcessing = async (payoutId = 'payout_seed_1', transferId = 'tr_123') => {
      const payout: any = {
        id: `po-${payouts.length + 1}`,
        creator: { id: 'creator-1' },
        amount: 20,
        currency: 'usd',
        status: 'processing',
        purpose: 'monthly-payout',
        payoutId,
      };
      if (transferId) payout.stripeTransferId = transferId;
      await payoutRepository.save(payout);
      if (transferId) {
        transfers.set(transferId, { id: transferId, status: 'paid', metadata: { payoutId } });
      }
      return payout;
    };

    return {
      service,
      paymentsService,
      payouts,
      transfers,
      walletCredits,
      stripe,
      seedProcessing,
    };
  }

  it('finalizes a processing payout as paid when the Stripe transfer is paid', async () => {
    const h = buildHarness();
    const payout = await h.seedProcessing('payout_seed_1', 'tr_123');

    const summary = await h.service.reconcilePayouts();

    expect(summary.skipped).toBe(false);
    expect(summary.processed).toBe(1);
    expect(summary.markedPaid).toBe(1);
    expect(summary.markedFailed).toBe(0);
    expect(payoutsStatus(h)).toBe('paid');
    expect(payout.processedAt).toBeDefined();
    expect(h.walletCredits).toHaveLength(0);
  });

  it('reverses a failed transfer exactly once (wallet credited, replay-safe)', async () => {
    const h = buildHarness();
    const payout = await h.seedProcessing('payout_seed_fail', 'tr_bad');
    h.transfers.set('tr_bad', {
      id: 'tr_bad',
      status: 'failed',
      failure_message: 'Insufficient funds',
      metadata: { payoutId: 'payout_seed_fail' },
    });

    await h.service.reconcilePayouts();
    await h.service.reconcilePayouts(); // replay

    expect(payoutsStatus(h)).toBe('failed');
    expect(payout.failureReason).toBeDefined();
    expect(h.walletCredits).toHaveLength(1);
    expect(h.walletCredits[0].userId).toBe('creator-1');
    expect(h.walletCredits[0].amount).toBe(20);
    expect(h.walletCredits[0].options).toMatchObject({
      purpose: 'payout-transfer-failed',
      type: 'payout_reversal',
    });
  });

  it('resolves an orphaned payout via metadata payoutId when stripeTransferId is missing', async () => {
    const h = buildHarness();
    const payout = await h.seedProcessing('payout_orphan', null);
    h.transfers.set('tr_orphan', {
      id: 'tr_orphan',
      status: 'paid',
      metadata: { payoutId: 'payout_orphan' },
    });

    const summary = await h.service.reconcilePayouts();

    expect(summary.processed).toBe(1);
    expect(summary.markedPaid).toBe(1);
    expect(payout.stripeTransferId).toBe('tr_orphan');
    expect(payoutsStatus(h)).toBe('paid');
  });

  it('skips entirely when Stripe Connect payouts are disabled', async () => {
    const h = buildHarness(false);
    await h.seedProcessing('payout_skip', 'tr_skip');

    const summary = await h.service.reconcilePayouts();

    expect(summary.skipped).toBe(true);
    expect(summary.processed).toBe(0);
    expect(payoutsStatus(h)).toBe('processing');
  });

  function payoutsStatus(h: ReturnType<typeof buildHarness>): string {
    return h.payouts[h.payouts.length - 1]?.status;
  }
});