import { PaymentsService } from '../src/payments/payments.service';

describe('PaymentsService payouts', () => {
  it('requests a payout and debits the creator wallet', async () => {
    const paymentRepository = {
      create: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([]),
    };
    const payoutRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const usersRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'creator-1',
        stripeConnectAccountId: null,
        payoutsEnabled: false,
      }),
      save: jest.fn(async (u) => u),
    };
    const walletService = {
      debit: jest.fn().mockResolvedValue({ walletBalance: 75 }),
      credit: jest.fn().mockResolvedValue({ walletBalance: 100 }),
    };
    const configService = {
      // PAYMENTS_ENABLED / STRIPE key unset → manual (non-Connect) path
      get: jest.fn().mockReturnValue(undefined),
    };
    const webhooksService = {
      dispatchEvent: jest.fn().mockResolvedValue(undefined),
    };

    const service = new PaymentsService(
      paymentRepository as any,
      payoutRepository as any,
      usersRepository as any,
      walletService as any,
      configService as any,
      webhooksService as any,
    );

    const result = await service.requestPayout('creator-1', 25, 'monthly-payout');

    expect(result.success).toBe(true);
    expect(result.mode).toBe('manual');
    expect(payoutRepository.create).toHaveBeenCalled();
    expect(walletService.debit).toHaveBeenCalledWith('creator-1', 25, {
      purpose: 'monthly-payout',
      type: 'payout',
      reference: expect.stringContaining('payout_creator-1_'),
    });
    expect(result.payoutId).toContain('payout_');
  });

  it('rejects a payout that would overdraw the wallet', async () => {
    const paymentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    };
    const payoutRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      count: jest.fn().mockResolvedValue(0),
    };
    const usersRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 'creator-1' }),
    };
    const walletService = {
      debit: jest.fn().mockRejectedValue(
        Object.assign(new Error('Insufficient balance'), { status: 400 }),
      ),
      credit: jest.fn(),
    };
    const configService = { get: jest.fn().mockReturnValue(undefined) };
    const webhooksService = { dispatchEvent: jest.fn() };

    const service = new PaymentsService(
      paymentRepository as any,
      payoutRepository as any,
      usersRepository as any,
      walletService as any,
      configService as any,
      webhooksService as any,
    );

    await expect(service.requestPayout('creator-1', 1000, 'monthly-payout')).rejects.toThrow(
      'Insufficient balance',
    );
    // Debit failed → no payout row may be created.
    expect(payoutRepository.create).not.toHaveBeenCalled();
  });

  describe('payout claims', () => {
    const payout = {
      id: 'payout-1',
      status: 'pending',
      amount: 25,
      currency: 'usd',
      payoutId: 'payout_creator-1_reference',
      purpose: 'monthly-payout',
      creator: {
        id: 'creator-1',
        stripeConnectAccountId: 'acct_test',
        payoutsEnabled: true,
      },
    };

    function buildService(
      affected: number,
      options: {
        connect?: boolean;
        creditError?: Error;
        updateErrorAfterClaim?: Error;
        transferError?: Error;
      } = {},
    ) {
      const currentPayout: any = {
        ...payout,
        status: affected === 0 ? 'processing' : 'pending',
      };
      const payoutRepository = {
        update: jest.fn(async (criteria: any, patch: any) => {
          if (affected === 0) return { affected: 0 };
          if (criteria.status && currentPayout.status !== criteria.status) {
            return { affected: 0 };
          }
          Object.assign(currentPayout, patch);
          return { affected: 1 };
        }),
        findOne: jest.fn(async () => ({ ...currentPayout })),
        save: jest.fn(async (value) => value),
      };
      const walletService = {
        credit: options.creditError
          ? jest.fn().mockRejectedValue(options.creditError)
          : jest.fn().mockResolvedValue({ walletBalance: 25 }),
      };
      const configService = {
        get: jest.fn((key: string) => {
          if (options.connect && key === 'PAYMENTS_ENABLED') return 'true';
          if (options.connect && key === 'STRIPE_SECRET_KEY') return 'sk_test_claim';
          if (options.connect && key === 'STRIPE_CONNECT_ENABLED') return 'true';
          return undefined;
        }),
      };
      const service = new PaymentsService(
        {} as any,
        payoutRepository as any,
        { findOne: jest.fn() } as any,
        walletService as any,
        configService as any,
        { dispatchEvent: jest.fn().mockResolvedValue(undefined) } as any,
      );
      let stripe: any = null;
      if (options.connect) {
        stripe = {
          transfers: {
            create: options.transferError
              ? jest.fn().mockRejectedValue(options.transferError)
              : jest.fn().mockResolvedValue({ id: 'tr_claim' }),
          },
        };
        (service as any).stripe = stripe;
      }
      if (options.updateErrorAfterClaim) {
        payoutRepository.update
          .mockImplementationOnce(async (criteria: any, patch: any) => {
            if (criteria.status && currentPayout.status !== criteria.status) {
              return { affected: 0 };
            }
            Object.assign(currentPayout, patch);
            return { affected: 1 };
          })
          .mockRejectedValueOnce(options.updateErrorAfterClaim);
      }
      return { service, payoutRepository, walletService, stripe };
    }

    it('claims a pending payout before settling it', async () => {
      const h = buildService(1);

      const result = await h.service.approvePayout('payout-1');

      expect(h.payoutRepository.update).toHaveBeenCalledWith(
        { id: 'payout-1', status: 'pending' },
        { status: 'processing' },
      );
      expect(result.status).toBe('paid');
      expect(result.mode).toBe('manual');
      expect(h.payoutRepository.update).toHaveBeenNthCalledWith(
        2,
        { id: 'payout-1', status: 'processing' },
        { status: 'paid', processedAt: expect.any(Date) },
      );
    });

    it('rejects a second claimant without settling the payout twice', async () => {
      const h = buildService(0);

      await expect(h.service.approvePayout('payout-1')).rejects.toThrow(
        'Payout is not pending (status: processing)',
      );
      expect(h.payoutRepository.save).not.toHaveBeenCalled();
      expect(h.walletService.credit).not.toHaveBeenCalled();
    });

    it('claims before refunding a rejected payout', async () => {
      const h = buildService(1);

      const result = await h.service.rejectPayout('payout-1', 'manual review');

      expect(h.payoutRepository.update).toHaveBeenCalledWith(
        { id: 'payout-1', status: 'pending' },
        { status: 'processing' },
      );
      expect(h.walletService.credit).toHaveBeenCalledWith('creator-1', 25, {
        purpose: 'payout-rejected',
        type: 'payout_reversal',
        reference: 'payout_creator-1_reference',
      });
      expect(result.status).toBe('rejected');
    });

    it('does not refund the wallet when settlement persistence fails after a transfer', async () => {
      const h = buildService(1, {
        connect: true,
        updateErrorAfterClaim: new Error('database unavailable'),
      });

      await expect(h.service.approvePayout('payout-1')).rejects.toThrow('database unavailable');
      expect(h.stripe.transfers.create).toHaveBeenCalled();
      expect(h.walletService.credit).not.toHaveBeenCalled();
    });

    it('compensates a rejected transfer and releases the claim on refund failure', async () => {
      const transferHarness = buildService(1, {
        connect: true,
        transferError: new Error('transfer declined'),
      });
      const transferResult = await transferHarness.service.approvePayout('payout-1');

      expect(transferResult.status).toBe('failed');
      expect(transferHarness.walletService.credit).toHaveBeenCalledWith('creator-1', 25, {
        purpose: 'payout-transfer-failed',
        type: 'payout_reversal',
        reference: 'payout_creator-1_reference',
      });

      const refundHarness = buildService(1, {
        creditError: new Error('reversal failed'),
      });
      await expect(refundHarness.service.rejectPayout('payout-1')).rejects.toThrow(
        'reversal failed'
      );
      expect(refundHarness.payoutRepository.update).toHaveBeenNthCalledWith(
        2,
        { id: 'payout-1', status: 'processing' },
        { status: 'pending' }
      );
    });
  });
});
