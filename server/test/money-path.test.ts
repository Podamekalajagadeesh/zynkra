import { WalletService } from '../src/wallet/wallet.service';
import { splitRevenue } from '../src/payments/revenue-split';

interface MockUser {
  id: string;
  walletBalance: number;
}

interface MockLedgerEntry {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  currency: string;
  reference: string | null;
  purpose: string | null;
  createdAt: Date;
}

function createHarness() {
  let users: MockUser[] = [{ id: 'user-1', walletBalance: 100 }];
  let ledger: MockLedgerEntry[] = [];
  let ledgerId = 0;
  let lockMode: string | undefined;
  let whereId: string | undefined;

  const usersRepository = {
    findOne: jest.fn(async ({ where }: any) => users.find((user) => user.id === where?.id) ?? null),
  };

  const ledgerRepository = {
    find: jest.fn(async ({ where, take, order }: any) => {
      const direction = order?.createdAt === 'ASC' ? 1 : -1;
      return ledger
        .filter((entry) => entry.userId === where?.user?.id)
        .sort((a, b) => direction * (a.createdAt.getTime() - b.createdAt.getTime()))
        .slice(0, take ?? 100);
    }),
  };

  const queryBuilder: any = {
    setLock: jest.fn((mode: string) => {
      lockMode = mode;
      return queryBuilder;
    }),
    where: jest.fn((_condition: string, params: any) => {
      whereId = params?.id;
      return queryBuilder;
    }),
    getOne: jest.fn(async () => {
      const found = users.find((user) => user.id === whereId);
      return found ? { ...found } : null;
    }),
  };

  const manager = {
    getRepository: jest.fn(() => ({
      createQueryBuilder: jest.fn(() => queryBuilder),
    })),
    create: jest.fn((_entity: any, data: any) => ({
      ...data,
      id: `ledger-${++ledgerId}`,
      createdAt: new Date(Date.now() + ledgerId),
    })),
    save: jest.fn(async (_entity: any, data: any) => {
      if ('walletBalance' in data) {
        const index = users.findIndex((user) => user.id === data.id);
        if (index >= 0) {
          users[index] = { ...users[index], walletBalance: data.walletBalance };
        } else {
          users.push({ id: data.id, walletBalance: data.walletBalance });
        }
      } else {
        ledger.push({
          id: data.id,
          userId: data.user.id,
          type: data.type,
          amount: data.amount,
          balanceAfter: data.balanceAfter,
          currency: data.currency,
          reference: data.reference,
          purpose: data.purpose,
          createdAt: data.createdAt,
        });
      }
      return data;
    }),
  };

  const dataSource = {
    transaction: jest.fn(async (callback: any) => callback(manager)),
  };

  const service = new WalletService(
    usersRepository as any,
    ledgerRepository as any,
    dataSource as any,
    {} as any
  );

  return {
    service,
    usersRepository,
    ledgerRepository,
    manager,
    getLockMode: () => lockMode,
    getBalanceFromStore: (id: string) => users.find((user) => user.id === id)?.walletBalance,
    getLedger: () => ledger,
  };
}

describe('WalletService money path', () => {
  it('credits a balance and writes the matching ledger entry', async () => {
    const h = createHarness();

    const result = await h.service.credit('user-1', 50, {
      purpose: 'tip',
      reference: 'payment-1',
    });

    expect(result.walletBalance).toBe(150);
    expect(h.getBalanceFromStore('user-1')).toBe(150);
    expect(h.getLockMode()).toBe('pessimistic_write');
    expect(h.getLedger()).toHaveLength(1);
    expect(h.getLedger()[0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        amount: 50,
        balanceAfter: 150,
        type: 'earning',
        purpose: 'tip',
        reference: 'payment-1',
      })
    );
  });

  it('debits a balance and records a negative payout entry', async () => {
    const h = createHarness();

    const result = await h.service.debit('user-1', 40, {
      purpose: 'payout',
      type: 'payout',
    });

    expect(result.walletBalance).toBe(60);
    expect(h.getLedger()[0]).toEqual(
      expect.objectContaining({
        amount: -40,
        balanceAfter: 60,
        type: 'payout',
        purpose: 'payout',
      })
    );
  });

  it('rejects an overdraw without changing the balance or ledger', async () => {
    const h = createHarness();

    await expect(h.service.debit('user-1', 101)).rejects.toThrow('Insufficient balance');

    expect(h.getBalanceFromStore('user-1')).toBe(100);
    expect(h.getLedger()).toHaveLength(0);
  });

  it('rejects non-finite movement amounts', async () => {
    const h = createHarness();

    await expect(h.service.credit('user-1', Number.NaN)).rejects.toThrow(
      'Invalid wallet movement amount'
    );
    await expect(h.service.debit('user-1', Number.POSITIVE_INFINITY)).rejects.toThrow(
      'Invalid wallet movement amount'
    );
    expect(h.getLedger()).toHaveLength(0);
  });

  it('rejects movements for an unknown user', async () => {
    const h = createHarness();

    await expect(h.service.credit('missing-user', 10)).rejects.toThrow('User not found');
    expect(h.getLedger()).toHaveLength(0);
  });

  it('returns newest ledger entries first and honors the limit', async () => {
    const h = createHarness();

    await h.service.credit('user-1', 10, { purpose: 'first' });
    await h.service.credit('user-1', 20, { purpose: 'second' });
    await h.service.credit('user-1', 30, { purpose: 'third' });

    const entries = await h.service.getLedger('user-1', 2);

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.purpose)).toEqual(['third', 'second']);
  });

  it('normalizes a payout reversal into a balanced ledger', async () => {
    const h = createHarness();

    await h.service.credit('user-1', 50, { purpose: 'tip' });
    await h.service.debit('user-1', 40, { purpose: 'payout', type: 'payout' });
    await h.service.credit('user-1', 40, {
      purpose: 'payout-reversal',
      type: 'payout_reversal',
    });

    expect(h.getBalanceFromStore('user-1')).toBe(150);
    const entries = await h.service.getLedger('user-1');
    expect(entries.map((entry) => entry.amount)).toEqual([40, -40, 50]);
  });
});

describe('Revenue split invariants', () => {
  it.each([0.07, 1, 4.99, 19.99, 100, 249.99])(
    'keeps recipient and platform shares equal to gross for %s',
    (amount) => {
      const split = splitRevenue(amount);
      expect(split.recipientAmount + split.platformFee).toBeCloseTo(split.gross, 2);
      expect(split.gross).toBeCloseTo(amount, 2);
    }
  );

  it.each([-1, 0, 1, 2, Number.NaN])('clamps fee rate %s', (feeRate) => {
    const split = splitRevenue(100, feeRate);
    expect(split.feeRate).toBeGreaterThanOrEqual(0);
    expect(split.feeRate).toBeLessThanOrEqual(1);
    expect(split.recipientAmount + split.platformFee).toBeCloseTo(100, 2);
  });
});
