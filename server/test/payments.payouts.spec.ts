import { PaymentsService } from '../src/payments/payments.service';

describe('PaymentsService payouts', () => {
  it('requests a payout and debits the creator wallet', async () => {
    const paymentRepository = {
      create: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
    };
    const payoutRepository = {
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue({}),
    };
    const walletService = {
      debit: jest.fn().mockResolvedValue({ walletBalance: 0 }),
      credit: jest.fn().mockResolvedValue({ walletBalance: 100 }),
    };

    const service = new PaymentsService(
      paymentRepository as any,
      payoutRepository as any,
      walletService as any,
    );

    const result = await service.requestPayout('creator-1', 25, 'monthly-payout');

    expect(result.success).toBe(true);
    expect(payoutRepository.create).toHaveBeenCalled();
    expect(walletService.debit).toHaveBeenCalledWith('creator-1', 25, { purpose: 'monthly-payout' });
    expect(result.payoutId).toContain('payout_');
  });
});
