import { PaymentsService } from './payments.service';

describe('PaymentsService demo scenario', () => {
  it('creates a demo payment transaction with proof-of-concept metadata', async () => {
    const persistedTransactions: Array<Record<string, any>> = [];
    const paymentRepository = {
      create: (data: Record<string, any>) => data,
      save: async (data: Record<string, any>) => {
        persistedTransactions.push(data);
        return data;
      },
    };

    const payoutRepository = {
      create: (data: Record<string, any>) => data,
      save: async (data: Record<string, any>) => data,
      find: async () => [],
    };

    const walletService = {
      credit: jest.fn(async () => ({ success: true })),
    };

    const service = new PaymentsService(
      paymentRepository as any,
      payoutRepository as any,
      walletService as any,
    );

    const result = await service.createDemoPaymentScenario(12.5, 'usd', 'creator-1', 'payer-1');

    expect(result.success).toBe(true);
    expect(result.amount).toBe(12.5);
    expect(result.mode).toBe('demo');
    expect(persistedTransactions[0].metadata?.scenario).toBe('proof-of-concept');
    expect(walletService.credit).toHaveBeenCalledWith('creator-1', 12.5, { purpose: 'demo-poc' });
  });
});
