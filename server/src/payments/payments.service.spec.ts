import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PLATFORM_USER_ID, splitRevenue } from './revenue-split';

const makeStripeMock = () => ({
  paymentIntents: { create: jest.fn(), confirm: jest.fn(), retrieve: jest.fn() },
  transfers: { create: jest.fn(), retrieve: jest.fn(), list: jest.fn() },
  accounts: { create: jest.fn(), retrieve: jest.fn() },
  accountLinks: { create: jest.fn() },
  webhooks: { constructEvent: jest.fn() },
  balance: { retrieve: jest.fn() },
});

const STRIPE_CONFIG: Record<string, string | undefined> = {
  PAYMENTS_ENABLED: 'true',
  STRIPE_SECRET_KEY: 'sk_test_local',
};
const CONNECT_CONFIG: Record<string, string | undefined> = {
  ...STRIPE_CONFIG,
  STRIPE_CONNECT_ENABLED: 'true',
};
const NO_CONNECT_CONFIG: Record<string, string | undefined> = {
  ...STRIPE_CONFIG,
  STRIPE_CONNECT_ENABLED: 'false',
};
const WEBHOOK_CONFIG: Record<string, string | undefined> = {
  ...STRIPE_CONFIG,
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
};

const buildPayments = (
  options: {
    config?: Record<string, string | undefined>;
    payments?: Record<string, any>;
    payouts?: Record<string, any>;
    users?: Record<string, any>;
    wallet?: Record<string, any>;
    webhooks?: Record<string, any>;
  } = {}
) => {
  const paymentRepository: Record<string, any> = {
    create: jest.fn((value: any) => ({ id: 'tx_1', ...value })),
    save: jest.fn(async (value: any) => value),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    ...options.payments,
  };
  const payoutRepository: Record<string, any> = {
    create: jest.fn((value: any) => ({ id: 'po_1', ...value })),
    save: jest.fn(async (value: any) => value),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    ...options.payouts,
  };
  const usersRepository: Record<string, any> = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn(async (value: any) => value),
    ...options.users,
  };
  const walletService: Record<string, any> = {
    credit: jest.fn().mockResolvedValue({}),
    debit: jest.fn().mockResolvedValue({}),
    ...options.wallet,
  };
  const configService = {
    get: jest.fn((key: string) =>
      options.config && key in options.config ? options.config[key] : undefined
    ),
  };
  const webhooksService: Record<string, any> = {
    dispatchEvent: jest.fn().mockResolvedValue(undefined),
    ...options.webhooks,
  };

  const service = new PaymentsService(
    paymentRepository as any,
    payoutRepository as any,
    usersRepository as any,
    walletService as any,
    configService as any,
    webhooksService as any
  );
  const stripe = makeStripeMock();
  if ((service as any).stripe) (service as any).stripe = stripe;

  return {
    service,
    paymentRepository,
    payoutRepository,
    usersRepository,
    walletService,
    configService,
    webhooksService,
    stripe,
  };
};

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

    const configService = {
      // NODE_ENV: undefined (non-production), PAYMENTS_ENABLED/STRIPE key unset
      get: jest.fn(() => undefined),
    };

    const service = new PaymentsService(
      paymentRepository as any,
      payoutRepository as any,
      {} as any,
      walletService as any,
      configService as any,
      {} as any
    );

    const result = await service.createDemoPaymentScenario(12.5, 'usd', 'creator-1', 'payer-1');

    expect(result.success).toBe(true);
    expect(result.amount).toBe(12.5);
    expect(result.mode).toBe('demo');
    expect(persistedTransactions[0].metadata?.scenario).toBe('proof-of-concept');
    expect(walletService.credit).toHaveBeenCalledWith('creator-1', 12.5, { purpose: 'demo-poc' });
  });

  it('refuses demo payments in production', async () => {
    const { service } = buildPayments({ config: { NODE_ENV: 'production' } });

    await expect(
      service.createDemoPaymentScenario(12.5, 'usd', 'creator-1', 'payer-1')
    ).rejects.toThrow('Demo payments are disabled in production.');
  });

  it('rejects non-positive demo amounts', async () => {
    const { service, paymentRepository } = buildPayments();

    await expect(service.createDemoPaymentScenario(0, 'usd', 'c1', 'p1')).rejects.toThrow(
      'Payment amount must be greater than zero'
    );
    await expect(
      service.createDemoPaymentScenario('abc' as any, 'usd', 'c1', 'p1')
    ).rejects.toThrow('Payment amount must be greater than zero');
    expect(paymentRepository.create).not.toHaveBeenCalled();
  });

  it('stores a demo transaction without a payer when none is supplied', async () => {
    const { service, paymentRepository, walletService } = buildPayments();

    await service.createDemoPaymentScenario(5, 'usd', 'creator-9', '');

    const stored = paymentRepository.create.mock.calls[0][0];
    expect(stored.payer).toBeNull();
    expect(stored.recipient).toEqual({ id: 'creator-9' });
    expect(stored.provider).toBe('demo');
    expect(walletService.credit).toHaveBeenCalledWith('creator-9', 5, { purpose: 'demo-poc' });
  });
});

describe('PaymentsService payment intent and processPayment', () => {
  it('refuses payment APIs while payments are disabled', async () => {
    const { service } = buildPayments();

    await expect(service.createPaymentIntent(100, 'usd')).rejects.toThrow(
      ServiceUnavailableException
    );
    await expect(service.processPayment('u1', 10, 'tip')).rejects.toThrow(
      'Payments are not enabled on this instance. Set PAYMENTS_ENABLED=true and STRIPE_SECRET_KEY to enable them.'
    );
    expect(service.isConnectEnabled).toBe(false);
  });

  it('refuses payments when the Stripe key is missing', async () => {
    const { service } = buildPayments({ config: { PAYMENTS_ENABLED: 'true' } });

    await expect(service.processPayment('u1', 10, 'tip')).rejects.toThrow(
      ServiceUnavailableException
    );
  });

  it('creates a payment intent with and without a payment method', async () => {
    const { service, stripe } = buildPayments({ config: STRIPE_CONFIG });
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_1' });

    await service.createPaymentIntent(1250, 'usd');
    await service.createPaymentIntent(1250, 'eur', { paymentMethodId: 'pm_1' });

    expect(stripe.paymentIntents.create).toHaveBeenNthCalledWith(1, {
      amount: 1250,
      currency: 'usd',
    });
    expect(stripe.paymentIntents.create).toHaveBeenNthCalledWith(2, {
      amount: 1250,
      currency: 'eur',
      payment_method: 'pm_1',
      confirm: true,
    });
  });

  it.each(['abc', 0, -1])('rejects processPayment amount %p', async (amount) => {
    const { service } = buildPayments({ config: STRIPE_CONFIG });

    await expect(service.processPayment('u1', amount as any, 'tip')).rejects.toThrow(
      'Payment amount must be greater than zero'
    );
    expect(BadRequestException).toBeDefined();
  });

  it('rejects a currency that is not a three-letter code', async () => {
    const { service } = buildPayments({ config: STRIPE_CONFIG });

    await expect(service.processPayment('u1', 10, 'tip', { currency: 'dollars' })).rejects.toThrow(
      'Payment currency must be a three-letter code'
    );
  });

  it('processes a succeeded payment and splits the recipient credit', async () => {
    const { service, paymentRepository, walletService, stripe } = buildPayments({
      config: STRIPE_CONFIG,
    });
    stripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      client_secret: 'cs_1',
    });

    const result = await service.processPayment('u1', 10, 'tip', {
      currency: 'USD',
      metadata: { note: 'n' },
      payerId: 'p1',
      recipientId: 'r1',
    });

    expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 1000,
      currency: 'usd',
    });
    const stored = paymentRepository.create.mock.calls[0][0];
    expect(stored.provider).toBe('stripe');
    expect(stored.payer).toEqual({ id: 'p1' });
    expect(stored.recipient).toEqual({ id: 'r1' });
    expect(stored.metadata).toEqual(
      expect.objectContaining({
        note: 'n',
        platformFeeRate: 0.1,
        paymentIntent: { id: 'pi_1', status: 'succeeded' },
      })
    );
    expect(walletService.credit).toHaveBeenNthCalledWith(
      1,
      'r1',
      9,
      expect.objectContaining({ purpose: 'tip', type: 'earning', reference: 'pi_1' })
    );
    expect(walletService.credit).toHaveBeenNthCalledWith(
      2,
      PLATFORM_USER_ID,
      1,
      expect.objectContaining({ purpose: 'platform-fee' })
    );
    expect(result).toEqual({
      success: true,
      status: 'succeeded',
      userId: 'u1',
      amount: 10,
      purpose: 'tip',
      paymentId: 'pi_1',
      transactionId: 'tx_1',
      clientSecret: 'cs_1',
      fulfillmentCompleted: false,
      currency: 'usd',
    });
  });

  it('defaults a missing intent status and reports an unpaid result', async () => {
    const { service, paymentRepository, walletService, stripe } = buildPayments({
      config: STRIPE_CONFIG,
    });
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_2' });

    const result = await service.processPayment('u1', 5, 'tip');

    expect(paymentRepository.create.mock.calls[0][0].status).toBe('requires_payment_method');
    expect(result.success).toBe(false);
    expect(result.clientSecret).toBeNull();
    expect(walletService.credit).not.toHaveBeenCalled();
  });

  it('reports a non-succeeded intent without fulfilling it', async () => {
    const { service, stripe, walletService, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
    });
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_3', status: 'requires_confirmation' });

    const result = await service.processPayment('u1', 5, 'tip', { payerId: 'p1' });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        status: 'requires_confirmation',
        fulfillmentCompleted: false,
        clientSecret: null,
      })
    );
    expect(paymentRepository.create.mock.calls[0][0].payer).toEqual({ id: 'p1' });
    expect(paymentRepository.create.mock.calls[0][0].recipient).toBeNull();
    expect(walletService.credit).not.toHaveBeenCalled();
  });

  it('falls back to the unsaved transaction when save returns nothing', async () => {
    const { service, paymentRepository, stripe } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { save: jest.fn().mockResolvedValue(undefined) },
    });
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_4', status: 'succeeded' });

    const result = await service.processPayment('u1', 5, 'tip');

    expect(result.transactionId).toBe('tx_1');
    expect(result.paymentId).toBe('pi_4');
    expect(paymentRepository.save).toHaveBeenCalled();
  });

  it('honours a custom platform fee rate when crediting the split', async () => {
    const { service, walletService, stripe } = buildPayments({ config: STRIPE_CONFIG });
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_5', status: 'succeeded' });

    await service.processPayment('u1', 10, 'tip', {
      recipientId: 'r1',
      platformFeeRate: 0.25,
    });

    expect(walletService.credit).toHaveBeenNthCalledWith(1, 'r1', 7.5, expect.anything());
    expect(walletService.credit).toHaveBeenNthCalledWith(
      2,
      PLATFORM_USER_ID,
      2.5,
      expect.objectContaining({ purpose: 'platform-fee' })
    );
  });

  it('skips the platform credit when the fee rate is zero', async () => {
    const { service, walletService, stripe } = buildPayments({ config: STRIPE_CONFIG });
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_6', status: 'succeeded' });

    await service.processPayment('u1', 10, 'tip', {
      recipientId: 'r1',
      platformFeeRate: 0,
    });

    expect(walletService.credit).toHaveBeenCalledTimes(1);
    expect(walletService.credit).toHaveBeenCalledWith(
      'r1',
      10,
      expect.objectContaining({ purpose: 'tip' })
    );
  });

  it('defers fulfillment when an immediate credit fails', async () => {
    const { service, walletService, stripe } = buildPayments({
      config: STRIPE_CONFIG,
      wallet: { credit: jest.fn().mockRejectedValue(new Error('wallet offline')) },
    });
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_7', status: 'succeeded' });

    const result = await service.processPayment('u1', 10, 'tip', { recipientId: 'r1' });

    expect(result.success).toBe(true);
    expect(result.fulfillmentCompleted).toBe(false);
    expect(walletService.credit).toHaveBeenCalled();
  });

  it('runs a registered fulfillment handler and marks it complete', async () => {
    const { service, paymentRepository, stripe } = buildPayments({ config: STRIPE_CONFIG });
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_8', status: 'succeeded' });
    const handler = jest.fn().mockResolvedValue(undefined);
    service.registerFulfillmentHandler('content_unlock', handler);

    const result = await service.processPayment('u1', 5, 'purchase', {
      recipientId: 'r1',
      metadata: { fulfillmentType: 'content_unlock' },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toEqual(
      expect.objectContaining({ paymentId: 'pi_8', purpose: 'purchase' })
    );
    expect(result.fulfillmentCompleted).toBe(true);
    expect(paymentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ fulfillmentStatus: 'completed' }),
      })
    );
  });

  it('does not fulfill a payment whose type has no registered handler', async () => {
    const { service, stripe } = buildPayments({ config: STRIPE_CONFIG });
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_9', status: 'succeeded' });

    const result = await service.processPayment('u1', 5, 'purchase', {
      recipientId: 'r1',
      metadata: { fulfillmentType: 'unknown_type' },
    });

    expect(result.success).toBe(true);
    expect(result.fulfillmentCompleted).toBe(false);
  });
});

describe('PaymentsService.confirmPayment', () => {
  it('rejects a payment the user does not own', async () => {
    const { service, paymentRepository } = buildPayments({ config: STRIPE_CONFIG });

    await expect(service.confirmPayment('pi_x', 'u1')).rejects.toThrow(NotFoundException);
    expect(paymentRepository.findOne).toHaveBeenCalledWith({
      where: { paymentId: 'pi_x' },
      relations: ['payer'],
    });

    paymentRepository.findOne.mockResolvedValue({ paymentId: 'pi_x', payer: { id: 'other' } });
    await expect(service.confirmPayment('pi_x', 'u1')).rejects.toThrow('Payment not found');

    paymentRepository.findOne.mockResolvedValue({ paymentId: 'pi_x' });
    await expect(service.confirmPayment('pi_x', 'u1')).rejects.toThrow('Payment not found');
  });

  it('confirms with a payment method and fulfills the succeeded payment', async () => {
    const transaction: any = {
      id: 'tx_9',
      paymentId: 'pi_ok',
      payer: { id: 'u1' },
      status: 'pending',
      amount: 10,
      purpose: 'tip',
      recipient: { id: 'r1' },
      metadata: {},
    };
    const { service, stripe, walletService, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });
    stripe.paymentIntents.confirm.mockResolvedValue({
      id: 'pi_ok',
      status: 'succeeded',
      client_secret: 'cs_ok',
    });

    const result = await service.confirmPayment('pi_ok', 'u1', 'pm_ok');

    expect(stripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_ok', {
      payment_method: 'pm_ok',
    });
    expect(transaction.status).toBe('succeeded');
    expect(transaction.metadata.confirmedByWebhookAt).toEqual(expect.any(String));
    expect(walletService.credit).toHaveBeenCalledWith(
      'r1',
      9,
      expect.objectContaining({ purpose: 'tip' })
    );
    expect(result).toEqual({
      success: true,
      status: 'succeeded',
      paymentId: 'pi_ok',
      clientSecret: 'cs_ok',
      fulfillmentCompleted: false,
    });
    expect(paymentRepository.save).toHaveBeenCalledWith(transaction);
  });

  it('retrieves an existing intent when no payment method is supplied', async () => {
    const transaction = {
      id: 'tx_10',
      paymentId: 'pi_re',
      payer: { id: 'u1' },
      status: 'succeeded',
      metadata: {},
    };
    const { service, stripe, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });
    stripe.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_re', status: 'succeeded' });

    const result = await service.confirmPayment('pi_re', 'u1');

    expect(stripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_re');
    expect(result.success).toBe(true);
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it('marks a canceled payment as canceled', async () => {
    const transaction = {
      id: 'tx_11',
      paymentId: 'pi_cancel',
      payer: { id: 'u1' },
      status: 'requires_payment_method',
      metadata: {},
    };
    const { service, stripe, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });
    stripe.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_cancel', status: 'canceled' });

    const result = await service.confirmPayment('pi_cancel', 'u1');

    expect(result.success).toBe(false);
    expect(transaction.status).toBe('canceled');
    expect(transaction.metadata).toEqual(
      expect.objectContaining({ failureEvent: 'payment_intent.canceled', failureMessage: null })
    );
    expect(paymentRepository.save).toHaveBeenCalledWith(transaction);
  });

  it('marks a failed payment as failed with the Stripe error message', async () => {
    const transaction = {
      id: 'tx_12',
      paymentId: 'pi_fail',
      payer: { id: 'u1' },
      status: 'requires_payment_method',
      metadata: {},
    };
    const { service, stripe } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_fail',
      status: 'payment_failed',
      last_payment_error: { message: 'card declined' },
    });

    const result = await service.confirmPayment('pi_fail', 'u1');

    expect(result.success).toBe(false);
    expect(transaction.status).toBe('failed');
    expect(transaction.metadata).toEqual(
      expect.objectContaining({
        failureEvent: 'payment_intent.payment_failed',
        failureMessage: 'card declined',
      })
    );
  });
});

describe('PaymentsService webhook events', () => {
  it('acknowledges event types it does not handle', async () => {
    const { service } = buildPayments({ config: STRIPE_CONFIG });

    const result = await service.handleWebhookEvent({ type: 'invoice.paid' });

    expect(result).toEqual({ received: true, handled: false });
  });

  it('confirms a payment_intent.succeeded event and credits the split', async () => {
    const transaction: any = {
      id: 'tx_w1',
      paymentId: 'pi_w1',
      status: 'pending',
      amount: 10,
      recipient: { id: 'r9' },
      metadata: {},
    };
    const { service, paymentRepository, walletService } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    const result = await service.handleWebhookEvent({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_w1' } },
    });

    expect(result.handled).toBe(true);
    expect(transaction.status).toBe('succeeded');
    expect(transaction.metadata.confirmedByWebhookAt).toEqual(expect.any(String));
    expect(walletService.credit).toHaveBeenNthCalledWith(
      1,
      'r9',
      9,
      expect.objectContaining({ purpose: 'payment', reference: 'pi_w1' })
    );
    expect(walletService.credit).toHaveBeenNthCalledWith(
      2,
      PLATFORM_USER_ID,
      1,
      expect.objectContaining({ purpose: 'platform-fee' })
    );
    expect(paymentRepository.save).toHaveBeenCalledWith(transaction);
  });

  it.each([null, 'refunded', 'partially_refunded'])(
    'skips confirmation when the stored transaction is %s',
    async (status) => {
      const transaction = status
        ? { id: 'tx', paymentId: 'pi', status, amount: 10, metadata: {} }
        : null;
      const { service, paymentRepository, walletService } = buildPayments({
        config: STRIPE_CONFIG,
        payments: { findOne: jest.fn().mockResolvedValue(transaction) },
      });

      const result = await service.handleWebhookEvent({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi' } },
      });

      expect(result.handled).toBe(true);
      expect(paymentRepository.save).not.toHaveBeenCalled();
      expect(walletService.credit).not.toHaveBeenCalled();
    }
  );

  it('leaves an already-credited succeeded payment untouched', async () => {
    const transaction = {
      id: 'tx_w2',
      paymentId: 'pi_w2',
      status: 'succeeded',
      amount: 10,
      recipient: { id: 'r9' },
      metadata: { recipientCredited: 9 },
    };
    const { service, paymentRepository, walletService } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_w2' } },
    });

    expect(walletService.credit).not.toHaveBeenCalled();
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it('fulfills an already-succeeded payment through its registered handler', async () => {
    const transaction: any = {
      id: 'tx_w4',
      paymentId: 'pi_w4',
      status: 'succeeded',
      amount: 10,
      recipient: { id: 'r9' },
      metadata: { recipientCredited: 9, fulfillmentType: 'content_unlock' },
    };
    const { service, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });
    const handler = jest.fn().mockResolvedValue(undefined);
    service.registerFulfillmentHandler('content_unlock', handler);

    await service.handleWebhookEvent({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_w4' } },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(transaction.metadata.fulfillmentStatus).toBe('completed');
    expect(paymentRepository.save).toHaveBeenCalledWith(transaction);
  });

  it('cancels a payment via webhook', async () => {
    const transaction: any = { id: 'tx_w3', paymentId: 'pi_w3', status: 'pending', metadata: {} };
    const { service } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'payment_intent.canceled',
      data: { object: { id: 'pi_w3' } },
    });

    expect(transaction.status).toBe('canceled');
    expect(transaction.metadata.failureEvent).toBe('payment_intent.canceled');
  });

  it.each(['succeeded', 'refunded', 'partially_refunded'])(
    'never regresses a %s payment on a failure event',
    async (status) => {
      const transaction = { id: 'tx', paymentId: 'pi', status, metadata: {} };
      const { service, paymentRepository } = buildPayments({
        config: STRIPE_CONFIG,
        payments: { findOne: jest.fn().mockResolvedValue(transaction) },
      });

      await service.handleWebhookEvent({
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi' } },
      });

      expect(paymentRepository.save).not.toHaveBeenCalled();
      expect(transaction.status).toBe(status);
    }
  );

  it('ignores failure events for unknown payments', async () => {
    const { service, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(null) },
    });

    await service.handleWebhookEvent({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_missing' } },
    });

    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it('finalizes a payout when its transfer settles', async () => {
    const payout = { id: 'po_1', status: 'processing', creator: { id: 'c1' } };
    const { service, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
    });

    await service.handleWebhookEvent({
      type: 'transfer.paid',
      data: { object: { id: 'tr_1' } },
    });

    expect(payoutRepository.findOne).toHaveBeenCalledWith({
      where: { stripeTransferId: 'tr_1' },
      relations: ['creator'],
    });
    expect(payoutRepository.update).toHaveBeenCalledWith(
      { id: 'po_1', status: 'processing' },
      expect.objectContaining({ status: 'paid' })
    );
  });

  it.each(['paid', 'failed', 'reversing'])(
    'does not re-finalize a payout already in status %s',
    async (status) => {
      const { service, payoutRepository } = buildPayments({
        config: CONNECT_CONFIG,
        payouts: { findOne: jest.fn().mockResolvedValue({ id: 'po_1', status }) },
      });

      await service.handleWebhookEvent({
        type: 'transfer.paid',
        data: { object: { id: 'tr_1' } },
      });

      expect(payoutRepository.update).not.toHaveBeenCalled();
    }
  );

  it('ignores transfer.paid for an unknown transfer', async () => {
    const { service, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(null) },
    });

    await service.handleWebhookEvent({
      type: 'transfer.paid',
      data: { object: { id: 'tr_unknown' } },
    });

    expect(payoutRepository.update).not.toHaveBeenCalled();
  });

  it('finds a payout by stamped transfer metadata when the id lookup misses', async () => {
    const payout = { id: 'po_2', status: 'processing', creator: { id: 'c1' } };
    const { service, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: {
        findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValue(payout),
      },
    });

    await service.handleWebhookEvent({
      type: 'transfer.paid',
      data: { object: { id: 'tr_2', metadata: { payoutId: 'payout_x' } } },
    });

    expect(payoutRepository.findOne).toHaveBeenNthCalledWith(2, {
      where: { payoutId: 'payout_x' },
      relations: ['creator'],
    });
    expect(payoutRepository.update).toHaveBeenCalled();
  });

  it('finds a payout that has no transfer id yet via metadata only', async () => {
    const payout = { id: 'po_3', status: 'processing', creator: { id: 'c1' } };
    const { service, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
    });

    await service.handleWebhookEvent({
      type: 'transfer.paid',
      data: { object: { metadata: { payoutId: 'payout_y' } } },
    });

    expect(payoutRepository.findOne).toHaveBeenCalledWith({
      where: { payoutId: 'payout_y' },
      relations: ['creator'],
    });
    expect(payoutRepository.update).toHaveBeenCalled();
  });

  it('reverses a failed transfer by crediting the creator back', async () => {
    const payout = {
      id: 'po_4',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 5,
      currency: 'usd',
      payoutId: 'payout_4',
    };
    const { service, walletService, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
    });

    await service.handleWebhookEvent({
      type: 'transfer.failed',
      data: { object: { id: 'tr_4' } },
    });

    expect(walletService.credit).toHaveBeenCalledWith(
      'c1',
      5,
      expect.objectContaining({ purpose: 'payout-transfer-failed', type: 'payout_reversal' })
    );
    expect(payoutRepository.update).toHaveBeenNthCalledWith(
      1,
      { id: 'po_4', status: 'processing' },
      { status: 'reversing' }
    );
    expect(payoutRepository.update).toHaveBeenNthCalledWith(
      2,
      { id: 'po_4', status: 'reversing' },
      expect.objectContaining({ status: 'failed', failureReason: 'Stripe transfer failed' })
    );
  });

  it.each(['failed', 'rejected', 'reversing'])(
    'does not reverse a payout already in status %s',
    async (status) => {
      const { service, walletService, payoutRepository } = buildPayments({
        config: CONNECT_CONFIG,
        payouts: {
          findOne: jest.fn().mockResolvedValue({ id: 'po_5', status, creator: { id: 'c1' } }),
        },
      });

      await service.handleWebhookEvent({
        type: 'transfer.failed',
        data: { object: { id: 'tr_5' } },
      });

      expect(walletService.credit).not.toHaveBeenCalled();
      expect(payoutRepository.update).not.toHaveBeenCalled();
    }
  );

  it('marks a reversal failed when the payout has no creator', async () => {
    const payout = { id: 'po_6', status: 'processing' };
    const { service, walletService, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
    });

    await service.handleWebhookEvent({
      type: 'transfer.failed',
      data: { object: { id: 'tr_6' } },
    });

    expect(walletService.credit).not.toHaveBeenCalled();
    expect(payoutRepository.update).toHaveBeenCalledWith(
      { id: 'po_6', status: 'processing' },
      expect.objectContaining({ status: 'failed', failureReason: 'Payout creator not found' })
    );
  });

  it('gives up a reversal that cannot claim the payout', async () => {
    const payout = {
      id: 'po_7',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 5,
      currency: 'usd',
      payoutId: 'payout_7',
    };
    const { service, walletService, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: {
        findOne: jest.fn().mockResolvedValue(payout),
        update: jest.fn().mockResolvedValue({ affected: 0 }),
      },
    });

    await service.handleWebhookEvent({
      type: 'transfer.failed',
      data: { object: { id: 'tr_7' } },
    });

    expect(walletService.credit).not.toHaveBeenCalled();
    expect(payoutRepository.update).toHaveBeenCalledTimes(1);
  });

  it('restores a reversing payout when the wallet credit fails', async () => {
    const payout = {
      id: 'po_8',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 5,
      currency: 'usd',
      payoutId: 'payout_8',
    };
    const { service, walletService, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
      wallet: { credit: jest.fn().mockRejectedValue(new Error('wallet down')) },
    });

    await expect(
      service.handleWebhookEvent({
        type: 'transfer.failed',
        data: { object: { id: 'tr_8' } },
      })
    ).rejects.toThrow('wallet down');

    expect(payoutRepository.update).toHaveBeenNthCalledWith(
      2,
      { id: 'po_8', status: 'reversing' },
      { status: 'processing' }
    );
  });

  it('syncs Connect onboarding completion onto the cached user flag', async () => {
    const user = { id: 'u1', stripeConnectAccountId: 'acct_1', payoutsEnabled: false };
    const { service, usersRepository } = buildPayments({
      config: CONNECT_CONFIG,
      users: { findOne: jest.fn().mockResolvedValue(user) },
    });

    await service.handleWebhookEvent({
      type: 'account.updated',
      data: { object: { id: 'acct_1', payouts_enabled: true } },
    });

    expect(user.payoutsEnabled).toBe(true);
    expect(usersRepository.save).toHaveBeenCalledWith(user);
  });

  it.each([
    ['an account without an id', {}],
    ['an unknown account', { id: 'acct_unknown', payouts_enabled: true }],
  ])('ignores account.updated for %s', async (_label, account) => {
    const { service, usersRepository } = buildPayments({
      config: CONNECT_CONFIG,
      users: { findOne: jest.fn().mockResolvedValue(null) },
    });

    await service.handleWebhookEvent({
      type: 'account.updated',
      data: { object: account },
    });

    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('leaves an unchanged payoutsEnabled flag unsaved', async () => {
    const user = { id: 'u1', stripeConnectAccountId: 'acct_2', payoutsEnabled: true };
    const { service, usersRepository } = buildPayments({
      config: CONNECT_CONFIG,
      users: { findOne: jest.fn().mockResolvedValue(user) },
    });

    await service.handleWebhookEvent({
      type: 'account.updated',
      data: { object: { id: 'acct_2', payouts_enabled: true } },
    });

    expect(usersRepository.save).not.toHaveBeenCalled();
  });
});

describe('PaymentsService charge refunds', () => {
  it('fully refunds a credited payment and reverses both wallets', async () => {
    const transaction = {
      id: 'tx_r1',
      paymentId: 'pi_r1',
      status: 'succeeded',
      amount: 10,
      recipient: { id: 'r1' },
      metadata: { recipientCredited: 9, platformFeeRate: 0.1 },
    };
    const { service, paymentRepository, walletService } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_1', payment_intent: 'pi_r1', amount_refunded: 1000 } },
    });

    expect(walletService.debit).toHaveBeenNthCalledWith(
      1,
      'r1',
      9,
      expect.objectContaining({ purpose: 'refund', reference: 'pi_r1' })
    );
    expect(walletService.debit).toHaveBeenNthCalledWith(
      2,
      PLATFORM_USER_ID,
      1,
      expect.objectContaining({ purpose: 'platform-fee-refund' })
    );
    expect(transaction.status).toBe('refunded');
    expect(transaction.metadata).toEqual(
      expect.objectContaining({ refundedGross: 10, recipientReversed: 9, platformReversed: 1 })
    );
    expect(paymentRepository.save).toHaveBeenCalledWith(transaction);
  });

  it('marks a partial refund as partially_refunded', async () => {
    const transaction = {
      id: 'tx_r2',
      paymentId: 'pi_r2',
      status: 'succeeded',
      amount: 10,
      recipient: { id: 'r1' },
      metadata: { recipientCredited: 9, platformFeeRate: 0.1 },
    };
    const { service, walletService } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_2', payment_intent: 'pi_r2', amount_refunded: 500 } },
    });

    expect(transaction.status).toBe('partially_refunded');
    expect(walletService.debit).toHaveBeenNthCalledWith(
      1,
      'r1',
      4.5,
      expect.objectContaining({ purpose: 'refund' })
    );
    expect(walletService.debit).toHaveBeenNthCalledWith(
      2,
      PLATFORM_USER_ID,
      0.5,
      expect.objectContaining({ purpose: 'platform-fee-refund' })
    );
  });

  it('marks the refund without reversing wallets when no credit was recorded', async () => {
    const transaction: any = {
      id: 'tx_r3',
      paymentId: 'pi_r3',
      status: 'succeeded',
      amount: 10,
      recipient: { id: 'r1' },
      metadata: {},
    };
    const { service, walletService, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_3', payment_intent: 'pi_r3', amount_refunded: 1000 } },
    });

    expect(walletService.debit).not.toHaveBeenCalled();
    expect(transaction.status).toBe('refunded');
    expect(transaction.metadata.recipientReversed).toBe(9);
    expect(transaction.metadata.platformReversed).toBe(1);
    expect(paymentRepository.save).toHaveBeenCalledWith(transaction);
  });

  it('accepts an object payment_intent and ignores a zero-value refund', async () => {
    const transaction = {
      id: 'tx_r4',
      paymentId: 'pi_r4',
      status: 'succeeded',
      amount: 10,
      metadata: {},
    };
    const { service, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_4', payment_intent: { id: 'pi_r4' }, amount_refunded: 0 } },
    });

    expect(transaction.status).toBe('succeeded');
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it('ignores refunds for charges without a payment intent or transaction', async () => {
    const { service, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(null) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_5' } },
    });
    expect(paymentRepository.findOne).not.toHaveBeenCalled();

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_6', payment_intent: 'pi_missing' } },
    });
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it('ignores repeat refunds once the delta is exhausted', async () => {
    const transaction = {
      id: 'tx_r5',
      paymentId: 'pi_r5',
      status: 'refunded',
      amount: 10,
      metadata: { refundedGross: 10 },
    };
    const { service, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_7', payment_intent: 'pi_r5', amount_refunded: 1000 } },
    });

    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it('reverses only the platform share when the fee rate consumed the recipient share', async () => {
    const transaction = {
      id: 'tx_r6',
      paymentId: 'pi_r6',
      status: 'succeeded',
      amount: 10,
      recipient: { id: 'r1' },
      metadata: { recipientCredited: 0, platformFeeRate: 1 },
    };
    const { service, walletService } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_8', payment_intent: 'pi_r6', amount_refunded: 1000 } },
    });

    expect(walletService.debit).toHaveBeenCalledTimes(1);
    expect(walletService.debit).toHaveBeenCalledWith(
      PLATFORM_USER_ID,
      10,
      expect.objectContaining({ purpose: 'platform-fee-refund' })
    );
    expect(transaction.status).toBe('refunded');
  });

  it('reverses only the recipient share when the fee rate is zero', async () => {
    const transaction = {
      id: 'tx_r7',
      paymentId: 'pi_r7',
      status: 'succeeded',
      amount: 10,
      recipient: { id: 'r1' },
      metadata: { recipientCredited: 10, platformFeeRate: 0 },
    };
    const { service, walletService } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_9', payment_intent: 'pi_r7', amount_refunded: 1000 } },
    });

    expect(walletService.debit).toHaveBeenCalledTimes(1);
    expect(walletService.debit).toHaveBeenCalledWith(
      'r1',
      10,
      expect.objectContaining({ purpose: 'refund' })
    );
  });

  it('skips wallet reversals when the transaction has no recipient', async () => {
    const transaction = {
      id: 'tx_r8',
      paymentId: 'pi_r8',
      status: 'succeeded',
      amount: 10,
      metadata: { recipientCredited: 9 },
    };
    const { service, walletService, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_10', payment_intent: 'pi_r8', amount_refunded: 1000 } },
    });

    expect(walletService.debit).not.toHaveBeenCalled();
    expect(paymentRepository.save).toHaveBeenCalledWith(transaction);
    expect(transaction.status).toBe('refunded');
  });

  it('treats a refund with no amount_refunded as a full refund', async () => {
    const transaction = {
      id: 'tx_r9',
      paymentId: 'pi_r9',
      status: 'succeeded',
      amount: 10,
      metadata: {},
    };
    const { service, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_11', payment_intent: 'pi_r9' } },
    });

    expect(transaction.status).toBe('refunded');
    expect(paymentRepository.save).toHaveBeenCalledWith(transaction);
  });
});

describe('PaymentsService payout requests', () => {
  it.each(['abc', 0, -5])('rejects requestPayout amount %p', async (amount) => {
    const { service, payoutRepository } = buildPayments({ config: NO_CONNECT_CONFIG });

    await expect(service.requestPayout('c1', amount as any, 'withdrawal')).rejects.toThrow(
      'Payout amount must be greater than zero'
    );
    expect(payoutRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a payout request for a missing creator', async () => {
    const { service, walletService } = buildPayments({ config: NO_CONNECT_CONFIG });

    await expect(service.requestPayout('ghost', 5, 'withdrawal')).rejects.toThrow(
      NotFoundException
    );
    expect(walletService.debit).not.toHaveBeenCalled();
  });

  it('leaves a payout pending for manual settlement when Connect is off', async () => {
    const { service, payoutRepository, walletService, stripe } = buildPayments({
      config: NO_CONNECT_CONFIG,
      users: { findOne: jest.fn().mockResolvedValue({ id: 'c1' }) },
    });

    const result = await service.requestPayout('c1', 25, 'withdrawal');

    expect(walletService.debit).toHaveBeenCalledWith('c1', 25, {
      purpose: 'withdrawal',
      type: 'payout',
      reference: expect.stringContaining('payout_c1_'),
    });
    expect(payoutRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 25, status: 'pending', currency: 'usd' })
    );
    expect(result).toEqual(
      expect.objectContaining({ success: true, status: 'pending', mode: 'manual', amount: 25 })
    );
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it('leaves a payout manual when the creator has no Connect account', async () => {
    const { service, stripe } = buildPayments({
      config: CONNECT_CONFIG,
      users: { findOne: jest.fn().mockResolvedValue({ id: 'c1' }) },
    });

    const result = await service.requestPayout('c1', 10, 'withdrawal');

    expect(result.mode).toBe('manual');
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it('leaves a payout manual when Connect payouts are not enabled for the creator', async () => {
    const { service, stripe } = buildPayments({
      config: CONNECT_CONFIG,
      users: {
        findOne: jest
          .fn()
          .mockResolvedValue({ id: 'c1', stripeConnectAccountId: 'acct_1', payoutsEnabled: false }),
      },
    });

    const result = await service.requestPayout('c1', 10, 'withdrawal');

    expect(result.mode).toBe('manual');
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it('transfers immediately for an onboarded creator and marks the payout paid', async () => {
    const { service, stripe, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      users: {
        findOne: jest
          .fn()
          .mockResolvedValue({ id: 'c1', stripeConnectAccountId: 'acct_ok', payoutsEnabled: true }),
      },
    });
    stripe.transfers.create.mockResolvedValue({ id: 'tr_9' });

    const result = await service.requestPayout('c1', 5, 'withdrawal');

    expect(stripe.transfers.create).toHaveBeenCalledWith({
      amount: 500,
      currency: 'usd',
      destination: 'acct_ok',
      metadata: { payoutId: expect.any(String), creatorId: 'c1' },
    });
    expect(payoutRepository.findOne).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({ success: true, status: 'paid', mode: 'stripe' })
    );
  });

  it('returns the stored payout when the paid patch does not apply', async () => {
    const payoutStub = {
      id: 'po_1',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 5,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_x',
    };
    const { service, stripe, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      users: {
        findOne: jest
          .fn()
          .mockResolvedValue({ id: 'c1', stripeConnectAccountId: 'acct_ok', payoutsEnabled: true }),
      },
      payouts: {
        findOne: jest.fn().mockResolvedValue(payoutStub),
        update: jest.fn().mockResolvedValue({ affected: 0 }),
      },
    });
    stripe.transfers.create.mockResolvedValue({ id: 'tr_9' });

    const result = await service.requestPayout('c1', 5, 'withdrawal');

    expect(result.status).toBe('processing');
    expect(result.mode).toBe('stripe');
  });

  it('reverses the wallet and marks the payout failed when the transfer throws', async () => {
    const payoutStub = {
      id: 'po_1',
      status: 'failed',
      failureReason: 'transfer declined',
      creator: { id: 'c1' },
      amount: 5,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_x',
    };
    const { service, stripe, walletService, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      users: {
        findOne: jest
          .fn()
          .mockResolvedValue({ id: 'c1', stripeConnectAccountId: 'acct_ok', payoutsEnabled: true }),
      },
      payouts: { findOne: jest.fn().mockResolvedValue(payoutStub) },
    });
    stripe.transfers.create.mockRejectedValue(new Error('transfer declined'));

    const result = await service.requestPayout('c1', 5, 'withdrawal');

    expect(walletService.credit).toHaveBeenCalledWith('c1', 5, {
      purpose: 'payout-reversal',
      type: 'payout_reversal',
      reference: expect.any(String),
    });
    expect(payoutRepository.update).toHaveBeenCalledWith(
      { id: 'po_1', status: 'processing' },
      expect.objectContaining({ status: 'failed', failureReason: 'transfer declined' })
    );
    expect(result).toEqual(
      expect.objectContaining({ success: false, status: 'failed', mode: 'stripe' })
    );
  });

  it('returns the stored payout when the failure patch does not apply', async () => {
    const payoutStub = {
      id: 'po_1',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 5,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_x',
    };
    const { service, stripe, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      users: {
        findOne: jest
          .fn()
          .mockResolvedValue({ id: 'c1', stripeConnectAccountId: 'acct_ok', payoutsEnabled: true }),
      },
      payouts: {
        findOne: jest.fn().mockResolvedValue(payoutStub),
        update: jest.fn().mockResolvedValue({ affected: 0 }),
      },
    });
    stripe.transfers.create.mockRejectedValue(new Error('transfer declined'));

    const result = await service.requestPayout('c1', 5, 'withdrawal');

    expect(payoutRepository.update).toHaveBeenCalledWith(
      { id: 'po_1', status: 'processing' },
      expect.objectContaining({ status: 'failed' })
    );
    expect(result.status).toBe('processing');
  });

  it('falls back to a generic failure reason when the transfer error has no message', async () => {
    const payoutStub = {
      id: 'po_1',
      status: 'failed',
      failureReason: 'Stripe transfer failed',
      creator: { id: 'c1' },
      amount: 5,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_x',
    };
    const { service, stripe, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      users: {
        findOne: jest
          .fn()
          .mockResolvedValue({ id: 'c1', stripeConnectAccountId: 'acct_ok', payoutsEnabled: true }),
      },
      payouts: { findOne: jest.fn().mockResolvedValue(payoutStub) },
    });
    stripe.transfers.create.mockRejectedValue(null);

    const result = await service.requestPayout('c1', 5, 'withdrawal');

    expect(payoutRepository.update).toHaveBeenCalledWith(
      { id: 'po_1', status: 'processing' },
      expect.objectContaining({ failureReason: 'Stripe transfer failed' })
    );
    expect(result.status).toBe('failed');
  });

  it('lists a creator payout history newest first', async () => {
    const rows = [{ id: 'po_1' }, { id: 'po_2' }];
    const { service, payoutRepository } = buildPayments();
    payoutRepository.find.mockResolvedValue(rows);

    const result = await service.getCreatorPayouts('c1');

    expect(payoutRepository.find).toHaveBeenCalledWith({
      where: { creator: { id: 'c1' } },
      order: { createdAt: 'DESC' },
    });
    expect(result).toBe(rows);
  });

  it('sendPayout delegates to requestPayout', async () => {
    const { service } = buildPayments({ config: NO_CONNECT_CONFIG });

    await expect(service.sendPayout('c1', 0, 'withdrawal')).rejects.toThrow(
      'Payout amount must be greater than zero'
    );
  });
});

describe('PaymentsService scheduled payouts', () => {
  it('lists only pending payouts that are due now or overdue', async () => {
    const past = Date.now() - 60_000;
    const future = Date.now() + 60_000;
    const rows = [
      { id: 'po_now' },
      { id: 'po_past', dueAt: new Date(past) },
      { id: 'po_future', dueAt: new Date(future) },
    ];
    const { service, payoutRepository } = buildPayments();
    payoutRepository.find.mockResolvedValue(rows);

    const result = await service.listPendingPayouts();

    expect(payoutRepository.find).toHaveBeenCalledWith({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
    });
    expect(result.map((p: any) => p.id)).toEqual(['po_now', 'po_past']);
  });

  it.each(['abc', 0])('rejects schedulePayout amount %p', async (amount) => {
    const { service } = buildPayments();

    await expect(
      service.schedulePayout('c1', amount as any, 'withdrawal', new Date())
    ).rejects.toThrow('Payout amount must be greater than zero');
  });

  it('rejects a dueAt that is not a Date', async () => {
    const { service, walletService } = buildPayments();

    await expect(service.schedulePayout('c1', 5, 'withdrawal', 'tomorrow' as any)).rejects.toThrow(
      'Invalid dueAt date'
    );
    expect(walletService.debit).not.toHaveBeenCalled();
  });

  it('rejects a dueAt that is an invalid Date', async () => {
    const { service } = buildPayments();

    await expect(
      service.schedulePayout('c1', 5, 'withdrawal', new Date('not-a-date'))
    ).rejects.toThrow('Invalid dueAt date');
  });

  it('rejects a schedule request for a missing creator', async () => {
    const { service } = buildPayments();

    await expect(service.schedulePayout('ghost', 5, 'withdrawal', new Date())).rejects.toThrow(
      NotFoundException
    );
  });

  it('debits immediately and stores the scheduled payout as pending', async () => {
    const dueAt = new Date(Date.now() + 3_600_000);
    const { service, payoutRepository, walletService } = buildPayments({
      users: { findOne: jest.fn().mockResolvedValue({ id: 'c1' }) },
    });

    const result = await service.schedulePayout('c1', 40, 'withdrawal', dueAt);

    expect(walletService.debit).toHaveBeenCalledWith('c1', 40, {
      purpose: 'withdrawal',
      type: 'payout',
      reference: expect.stringContaining('payout_c1_'),
    });
    expect(payoutRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 40, status: 'pending', dueAt })
    );
    expect(result).toEqual(
      expect.objectContaining({ success: true, status: 'pending', mode: 'manual', amount: 40 })
    );
  });
});

describe('PaymentsService admin payout queue', () => {
  it('auto-processing returns early while Connect is disabled', async () => {
    const { service, payoutRepository } = buildPayments({ config: NO_CONNECT_CONFIG });

    await service.autoProcessDuePayouts();

    expect(payoutRepository.find).not.toHaveBeenCalled();
  });

  it('auto-processing finds due payouts when Connect is enabled', async () => {
    const { service, payoutRepository } = buildPayments({ config: CONNECT_CONFIG });
    payoutRepository.find.mockResolvedValue([]);

    await service.autoProcessDuePayouts();

    expect(payoutRepository.find).toHaveBeenCalledWith({
      where: { status: 'pending', dueAt: expect.anything() },
      relations: ['creator'],
    });
  });

  it('auto-processing skips creators that are not ready for Connect', async () => {
    const { service, payoutRepository } = buildPayments({ config: CONNECT_CONFIG });
    payoutRepository.find.mockResolvedValue([
      { id: 'po_1', amount: 5, currency: 'usd', creator: { id: 'c1' } },
    ]);
    const approve = jest.spyOn(service, 'approvePayout');
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);

    await service.autoProcessDuePayouts();

    expect(approve).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Skipped scheduled payout po_1'));
    approve.mockRestore();
    warn.mockRestore();
  });

  it('auto-processing logs a successful release', async () => {
    const { service, payoutRepository } = buildPayments({ config: CONNECT_CONFIG });
    payoutRepository.find.mockResolvedValue([
      {
        id: 'po_1',
        amount: 5,
        currency: 'usd',
        creator: { id: 'c1', stripeConnectAccountId: 'acct_1', payoutsEnabled: true },
      },
    ]);
    const approve = jest
      .spyOn(service, 'approvePayout')
      .mockResolvedValue({ status: 'paid' } as any);
    const log = jest.spyOn((service as any).logger, 'log').mockImplementation(() => undefined);

    await service.autoProcessDuePayouts();

    expect(approve).toHaveBeenCalledWith('po_1');
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Auto-released scheduled payout po_1')
    );
    approve.mockRestore();
    log.mockRestore();
  });

  it('auto-processing warns when a release ends in a non-paid status', async () => {
    const { service, payoutRepository } = buildPayments({ config: CONNECT_CONFIG });
    payoutRepository.find.mockResolvedValue([
      {
        id: 'po_2',
        amount: 5,
        currency: 'usd',
        creator: { id: 'c1', stripeConnectAccountId: 'acct_1', payoutsEnabled: true },
      },
    ]);
    const approve = jest
      .spyOn(service, 'approvePayout')
      .mockResolvedValue({ status: 'failed' } as any);
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);

    await service.autoProcessDuePayouts();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Scheduled payout po_2 ended in status failed')
    );
    approve.mockRestore();
    warn.mockRestore();
  });

  it('auto-processing swallows release errors', async () => {
    const { service, payoutRepository } = buildPayments({ config: CONNECT_CONFIG });
    payoutRepository.find.mockResolvedValue([
      {
        id: 'po_3',
        amount: 5,
        currency: 'usd',
        creator: { id: 'c1', stripeConnectAccountId: 'acct_1', payoutsEnabled: true },
      },
    ]);
    const approve = jest
      .spyOn(service, 'approvePayout')
      .mockRejectedValue(new Error('stripe down'));
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);

    await expect(service.autoProcessDuePayouts()).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to auto-release payout po_3: stripe down')
    );
    approve.mockRestore();
    warn.mockRestore();
  });

  it('rejects an approval when the payout is not pending', async () => {
    const { service, payoutRepository } = buildPayments({
      payouts: {
        update: jest.fn().mockResolvedValue({ affected: 0 }),
        findOne: jest.fn().mockResolvedValue({ id: 'po_1', status: 'paid' }),
      },
    });

    await expect(service.approvePayout('po_1')).rejects.toThrow(
      'Payout is not pending (status: paid)'
    );
    expect(payoutRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'po_1' },
      relations: ['creator'],
    });
  });

  it('rejects an approval when the payout has no creator', async () => {
    const { service, payoutRepository } = buildPayments({
      payouts: { findOne: jest.fn().mockResolvedValue({ id: 'po_1', status: 'processing' }) },
    });

    await expect(service.approvePayout('po_1')).rejects.toThrow(NotFoundException);
    expect(payoutRepository.update).toHaveBeenNthCalledWith(
      2,
      { id: 'po_1', status: 'processing' },
      { status: 'pending' }
    );
  });

  it('settles a payout manually and dispatches the completion webhook', async () => {
    const payout = {
      id: 'po_1',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 30,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_1',
    };
    const { service, payoutRepository, webhooksService, stripe } = buildPayments({
      config: NO_CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
    });

    const result = await service.approvePayout('po_1');

    expect(stripe.transfers.create).not.toHaveBeenCalled();
    expect(payoutRepository.update).toHaveBeenCalledWith(
      { id: 'po_1', status: 'processing' },
      expect.objectContaining({ status: 'paid' })
    );
    expect(webhooksService.dispatchEvent).toHaveBeenCalledWith('payment.payout_completed', {
      payoutId: 'po_1',
      payoutReference: 'payout_c1_1',
      creatorId: 'c1',
      amount: 30,
      currency: 'usd',
    });
    expect(result).toEqual(
      expect.objectContaining({ success: true, status: 'paid', mode: 'manual' })
    );
  });

  it('transfers via Stripe and marks the payout paid for onboarded creators', async () => {
    const payout: any = {
      id: 'po_2',
      status: 'processing',
      creator: { id: 'c1', stripeConnectAccountId: 'acct_ok', payoutsEnabled: true },
      amount: 30,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_2',
    };
    const { service, stripe } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
    });
    stripe.transfers.create.mockResolvedValue({ id: 'tr_a' });

    const result = await service.approvePayout('po_2');

    expect(stripe.transfers.create).toHaveBeenCalledWith({
      amount: 3000,
      currency: 'usd',
      destination: 'acct_ok',
      metadata: { payoutId: 'payout_c1_2', creatorId: 'c1' },
    });
    expect(payout.stripeTransferId).toBe('tr_a');
    expect(result).toEqual(
      expect.objectContaining({ success: true, status: 'paid', mode: 'stripe' })
    );
  });

  it('credits the creator back and marks the payout failed when the transfer throws', async () => {
    const payout = {
      id: 'po_3',
      status: 'processing',
      creator: { id: 'c1', stripeConnectAccountId: 'acct_ok', payoutsEnabled: true },
      amount: 30,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_3',
    };
    const stored = { ...payout, status: 'failed', failureReason: 'card closed' };
    const { service, stripe, walletService } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(stored) },
    });
    stripe.transfers.create.mockRejectedValue(new Error('card closed'));

    const result = await service.approvePayout('po_3');

    expect(walletService.credit).toHaveBeenCalledWith('c1', 30, {
      purpose: 'payout-transfer-failed',
      type: 'payout_reversal',
      reference: 'payout_c1_3',
    });
    expect(result).toEqual(
      expect.objectContaining({ success: false, status: 'failed', mode: 'stripe' })
    );
  });

  it('returns the stored payout when the Stripe failure patch does not apply', async () => {
    const stored = {
      id: 'po_4',
      status: 'processing',
      creator: { id: 'c1', stripeConnectAccountId: 'acct_ok', payoutsEnabled: true },
      amount: 30,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_4',
    };
    let call = 0;
    const { service, stripe, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: {
        findOne: jest.fn().mockResolvedValue(stored),
        update: jest.fn().mockImplementation(async () => {
          call += 1;
          return call === 1 ? { affected: 1 } : { affected: 0 };
        }),
      },
    });
    stripe.transfers.create.mockRejectedValue(new Error('card closed'));

    const result = await service.approvePayout('po_4');

    expect(result.status).toBe('processing');
    expect(result.mode).toBe('stripe');
    expect(payoutRepository.update).toHaveBeenCalledTimes(2);
  });

  it('returns the stored payout when the paid patch does not apply', async () => {
    const stored = {
      id: 'po_5',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 30,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_5',
    };
    const updates: any[] = [];
    const { service, payoutRepository } = buildPayments({
      config: NO_CONNECT_CONFIG,
      payouts: {
        findOne: jest.fn().mockResolvedValue(stored),
        update: jest.fn().mockImplementation(async (...args: any[]) => {
          updates.push(args);
          return updates.length === 1 ? { affected: 1 } : { affected: 0 };
        }),
      },
    });

    const result = await service.approvePayout('po_5');

    expect(result.status).toBe('processing');
    expect(result.mode).toBe('manual');
    expect(payoutRepository.update).toHaveBeenCalledTimes(2);
  });

  it('reverts to pending and rethrows when the manual settlement write fails', async () => {
    const stored = {
      id: 'po_6',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 30,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_6',
    };
    let call = 0;
    const { service, payoutRepository } = buildPayments({
      config: NO_CONNECT_CONFIG,
      payouts: {
        findOne: jest.fn().mockResolvedValue(stored),
        update: jest.fn().mockImplementation(async () => {
          call += 1;
          if (call === 1) return { affected: 1 };
          if (call === 2) throw new Error('db down');
          return { affected: 1 };
        }),
      },
    });

    await expect(service.approvePayout('po_6')).rejects.toThrow('db down');
    expect(payoutRepository.update).toHaveBeenNthCalledWith(
      3,
      { id: 'po_6', status: 'processing' },
      { status: 'pending' }
    );
  });

  it('ignores a failed completion webhook dispatch', async () => {
    const payout = {
      id: 'po_7',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 30,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_7',
    };
    const { service, webhooksService } = buildPayments({
      config: NO_CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
      webhooks: { dispatchEvent: jest.fn().mockRejectedValue(new Error('webhook down')) },
    });
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);

    const result = await service.approvePayout('po_7');

    expect(result.status).toBe('paid');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Payout completion webhook failed: webhook down')
    );
    warn.mockRestore();
  });

  it('logs a non-Error webhook dispatch failure', async () => {
    const payout = {
      id: 'po_8',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 30,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_8',
    };
    const { service, webhooksService } = buildPayments({
      config: NO_CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
      webhooks: { dispatchEvent: jest.fn().mockRejectedValue('plain failure') },
    });
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);

    const result = await service.approvePayout('po_8');

    expect(webhooksService.dispatchEvent).toHaveBeenCalled();
    expect(result.status).toBe('paid');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Payout completion webhook failed: plain failure')
    );
    warn.mockRestore();
  });

  it('rejects an admin payout without a reason using the default reason', async () => {
    const payout = {
      id: 'po_9',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 12,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_9',
    };
    const { service, walletService } = buildPayments({
      config: NO_CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
    });

    const result = await service.rejectPayout('po_9');

    expect(walletService.credit).toHaveBeenCalledWith('c1', 12, {
      purpose: 'payout-rejected',
      type: 'payout_reversal',
      reference: 'payout_c1_9',
    });
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        status: 'rejected',
        failureReason: 'Rejected by admin',
        mode: 'manual',
      })
    );
  });

  it('rejects a payout with an explicit reason', async () => {
    const payout = {
      id: 'po_10',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 12,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_10',
    };
    const { service } = buildPayments({
      config: NO_CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
    });

    const result = await service.rejectPayout('po_10', 'suspected fraud');

    expect(result.failureReason).toBe('suspected fraud');
  });

  it('rejects an admin payout when the payout is not pending', async () => {
    const { service } = buildPayments({
      payouts: {
        update: jest.fn().mockResolvedValue({ affected: 0 }),
        findOne: jest.fn().mockResolvedValue({ id: 'po_10', status: 'processing' }),
      },
    });

    await expect(service.rejectPayout('po_10')).rejects.toThrow(
      'Payout is not pending (status: processing)'
    );
  });

  it('rejects an admin payout when the payout has no creator', async () => {
    const { service, payoutRepository } = buildPayments({
      payouts: { findOne: jest.fn().mockResolvedValue({ id: 'po_11', status: 'processing' }) },
    });

    await expect(service.rejectPayout('po_11')).rejects.toThrow(NotFoundException);
    expect(payoutRepository.update).toHaveBeenNthCalledWith(
      2,
      { id: 'po_11', status: 'processing' },
      { status: 'pending' }
    );
  });

  it('reverts to pending when the rejection refund throws', async () => {
    const payout = {
      id: 'po_12',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 12,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_12',
    };
    const { service, payoutRepository } = buildPayments({
      config: NO_CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
      wallet: { credit: jest.fn().mockRejectedValue(new Error('wallet down')) },
    });

    await expect(service.rejectPayout('po_12')).rejects.toThrow('wallet down');
    expect(payoutRepository.update).toHaveBeenNthCalledWith(
      2,
      { id: 'po_12', status: 'processing' },
      { status: 'pending' }
    );
  });

  it('returns the stored payout when the rejection patch does not apply', async () => {
    const stored = {
      id: 'po_13',
      status: 'processing',
      creator: { id: 'c1' },
      amount: 12,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_13',
    };
    let call = 0;
    const { service } = buildPayments({
      config: NO_CONNECT_CONFIG,
      payouts: {
        findOne: jest.fn().mockResolvedValue(stored),
        update: jest.fn().mockImplementation(async () => {
          call += 1;
          return call === 1 ? { affected: 1 } : { affected: 0 };
        }),
      },
    });

    const result = await service.rejectPayout('po_13');

    expect(result.status).toBe('processing');
    expect(result.success).toBe(true);
  });
});

describe('PaymentsService Connect onboarding', () => {
  it('reports manual mode when the user does not exist', async () => {
    const { service } = buildPayments({ config: CONNECT_CONFIG });

    await expect(service.getConnectStatus('ghost')).rejects.toThrow(NotFoundException);
  });

  it('reports the manual rail while Connect is disabled', async () => {
    const { service, usersRepository } = buildPayments({
      config: NO_CONNECT_CONFIG,
      users: { findOne: jest.fn().mockResolvedValue({ id: 'u1' }) },
    });

    await expect(service.getConnectStatus('u1')).resolves.toEqual({
      enabled: false,
      mode: 'manual',
      payoutsEnabled: true,
      detailsSubmitted: true,
    });
    expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('reports a Connect account that was never created', async () => {
    const { service } = buildPayments({
      config: CONNECT_CONFIG,
      users: { findOne: jest.fn().mockResolvedValue({ id: 'u1', payoutsEnabled: false }) },
    });

    await expect(service.getConnectStatus('u1')).resolves.toEqual({
      enabled: true,
      mode: 'stripe',
      hasAccount: false,
      detailsSubmitted: false,
      payoutsEnabled: false,
    });
  });

  it('syncs the cached flag when Stripe says payouts are enabled', async () => {
    const user = { id: 'u1', stripeConnectAccountId: 'acct_1', payoutsEnabled: false };
    const { service, usersRepository, stripe } = buildPayments({
      config: CONNECT_CONFIG,
      users: { findOne: jest.fn().mockResolvedValue(user) },
    });
    stripe.accounts.retrieve.mockResolvedValue({ details_submitted: true, payouts_enabled: true });

    const status = await service.getConnectStatus('u1');

    expect(stripe.accounts.retrieve).toHaveBeenCalledWith('acct_1');
    expect(status).toEqual({
      enabled: true,
      mode: 'stripe',
      hasAccount: true,
      detailsSubmitted: true,
      payoutsEnabled: true,
    });
    expect(user.payoutsEnabled).toBe(true);
    expect(usersRepository.save).toHaveBeenCalledWith(user);
  });

  it('does not save when the cached flag already matches Stripe', async () => {
    const user = { id: 'u1', stripeConnectAccountId: 'acct_1', payoutsEnabled: false };
    const { service, usersRepository, stripe } = buildPayments({
      config: CONNECT_CONFIG,
      users: { findOne: jest.fn().mockResolvedValue(user) },
    });
    stripe.accounts.retrieve.mockResolvedValue({
      details_submitted: false,
      payouts_enabled: false,
    });

    const status = await service.getConnectStatus('u1');

    expect(status).toEqual(
      expect.objectContaining({ detailsSubmitted: false, payoutsEnabled: false })
    );
    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('refuses onboarding while payments are disabled', async () => {
    const { service } = buildPayments();

    await expect(service.createOnboardingLink('u1')).rejects.toThrow(ServiceUnavailableException);
  });

  it('refuses onboarding while Connect is disabled', async () => {
    const { service } = buildPayments({ config: NO_CONNECT_CONFIG });

    await expect(service.createOnboardingLink('u1')).rejects.toThrow(
      'Stripe Connect is not enabled on this instance. Payouts are settled manually.'
    );
  });

  it('refuses onboarding for a missing user', async () => {
    const { service } = buildPayments({ config: CONNECT_CONFIG });

    await expect(service.createOnboardingLink('ghost')).rejects.toThrow(NotFoundException);
  });

  it('creates an Express account then returns an onboarding link', async () => {
    const user: any = { id: 'u1', email: 'creator@example.com' };
    const { service, usersRepository, stripe } = buildPayments({
      config: CONNECT_CONFIG,
      users: { findOne: jest.fn().mockResolvedValue(user) },
    });
    stripe.accounts.create.mockResolvedValue({ id: 'acct_new' });
    stripe.accountLinks.create.mockResolvedValue({ url: 'https://connect.example/onboard' });

    const result = await service.createOnboardingLink('u1');

    expect(stripe.accounts.create).toHaveBeenCalledWith({
      type: 'express',
      email: 'creator@example.com',
      metadata: { userId: 'u1' },
      capabilities: { transfers: { requested: true } },
    });
    expect(user.stripeConnectAccountId).toBe('acct_new');
    expect(usersRepository.save).toHaveBeenCalledWith(user);
    expect(stripe.accountLinks.create).toHaveBeenCalledWith({
      account: 'acct_new',
      refresh_url: 'http://127.0.0.1:5173/earnings?connect=refresh',
      return_url: 'http://127.0.0.1:5173/earnings?connect=return',
      type: 'account_onboarding',
    });
    expect(result).toEqual({ url: 'https://connect.example/onboard' });
  });

  it('creates the account without an email when the user has none', async () => {
    const user = { id: 'u1' };
    const { service, stripe } = buildPayments({
      config: CONNECT_CONFIG,
      users: { findOne: jest.fn().mockResolvedValue(user) },
    });
    stripe.accounts.create.mockResolvedValue({ id: 'acct_new' });
    stripe.accountLinks.create.mockResolvedValue({ url: 'https://connect.example/onboard' });

    await service.createOnboardingLink('u1');

    expect(stripe.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: undefined })
    );
  });

  it('reuses an existing Connect account', async () => {
    const user = { id: 'u1', stripeConnectAccountId: 'acct_existing' };
    const { service, stripe } = buildPayments({
      config: CONNECT_CONFIG,
      users: { findOne: jest.fn().mockResolvedValue(user) },
    });
    stripe.accountLinks.create.mockResolvedValue({ url: 'https://connect.example/onboard' });

    await service.createOnboardingLink('u1');

    expect(stripe.accounts.create).not.toHaveBeenCalled();
    expect(stripe.accountLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({ account: 'acct_existing' })
    );
  });

  it('honours a configured CLIENT_URL in onboarding links', async () => {
    const user = { id: 'u1', stripeConnectAccountId: 'acct_existing' };
    const { service, stripe } = buildPayments({
      config: { ...CONNECT_CONFIG, CLIENT_URL: 'https://app.example.com' },
      users: { findOne: jest.fn().mockResolvedValue(user) },
    });
    stripe.accountLinks.create.mockResolvedValue({ url: 'https://connect.example/onboard' });

    await service.createOnboardingLink('u1');

    expect(stripe.accountLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        refresh_url: 'https://app.example.com/earnings?connect=refresh',
        return_url: 'https://app.example.com/earnings?connect=return',
      })
    );
  });
});

describe('PaymentsService webhook signature verification', () => {
  it('refuses to verify signatures while payments are disabled', () => {
    const { service } = buildPayments();

    expect(() => service.constructWebhookEvent(Buffer.from('{}'), 'sig')).toThrow(
      ServiceUnavailableException
    );
  });

  it('refuses to verify signatures without a webhook secret', () => {
    const { service } = buildPayments({ config: STRIPE_CONFIG });

    expect(() => service.constructWebhookEvent(Buffer.from('{}'), 'sig')).toThrow(
      'Stripe webhooks are not configured. Set STRIPE_WEBHOOK_SECRET to enable them.'
    );
  });

  it('verifies a signature with the configured secret', () => {
    const event = { id: 'evt_1', type: 'charge.refunded' };
    const { service, stripe } = buildPayments({ config: WEBHOOK_CONFIG });
    stripe.webhooks.constructEvent.mockReturnValue(event);
    const body = Buffer.from('{}');

    const result = service.constructWebhookEvent(body, 'whsec_sig');

    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(body, 'whsec_sig', 'whsec_test');
    expect(result).toBe(event);
  });

  it('maps a signature failure to a bad request', () => {
    const { service, stripe } = buildPayments({ config: WEBHOOK_CONFIG });
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('bad signature');
    });

    expect(() => service.constructWebhookEvent(Buffer.from('{}'), 'sig')).toThrow(
      'Invalid Stripe webhook signature: bad signature'
    );
  });
});

describe('PaymentsService reconciliation', () => {
  it('reports payments-disabled when there is no Stripe client', async () => {
    const { service } = buildPayments();

    await expect(
      service.syncPayoutWithStripe({ stripeTransferId: 'tr_1' } as any)
    ).resolves.toEqual({ outcome: 'unchanged', reason: 'payments-disabled' });
  });

  it('reports payments-disabled when Connect is off', async () => {
    const { service } = buildPayments({ config: NO_CONNECT_CONFIG });

    await expect(
      service.syncPayoutWithStripe({ stripeTransferId: 'tr_1' } as any)
    ).resolves.toEqual({ outcome: 'unchanged', reason: 'payments-disabled' });
  });

  it('skips a payout that never reached Stripe', async () => {
    const { service } = buildPayments({ config: CONNECT_CONFIG });

    await expect(service.syncPayoutWithStripe({ status: 'processing' } as any)).resolves.toEqual({
      outcome: 'unchanged',
      reason: 'no-stripe-transfer-id',
    });
  });

  it.each(['pending', 'rejected', 'failed'])('skips a payout in status %s', async (status) => {
    const { service } = buildPayments({ config: CONNECT_CONFIG });

    await expect(
      service.syncPayoutWithStripe({ stripeTransferId: 'tr_1', status } as any)
    ).resolves.toEqual({ outcome: 'unchanged', reason: `status-${status}` });
  });

  it('reports an unchanged outcome when the transfer lookup fails', async () => {
    const { service, stripe } = buildPayments({ config: CONNECT_CONFIG });
    stripe.transfers.retrieve.mockRejectedValue(new Error('stripe down'));

    await expect(
      service.syncPayoutWithStripe({ stripeTransferId: 'tr_1', status: 'processing' } as any)
    ).resolves.toEqual({ outcome: 'unchanged', reason: 'retrieve-failed: stripe down' });
  });

  it('finalizes the payout when Stripe reports the transfer paid', async () => {
    const payout = { id: 'po_s', status: 'processing', stripeTransferId: 'tr_1' };
    const { service, stripe, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
    });
    stripe.transfers.retrieve.mockResolvedValue({ id: 'tr_1', status: 'paid' });

    await expect(service.syncPayoutWithStripe(payout as any)).resolves.toEqual({
      outcome: 'paid',
    });
    expect(payoutRepository.update).toHaveBeenCalledWith(
      { id: 'po_s', status: 'processing' },
      expect.objectContaining({ status: 'paid' })
    );
  });

  it('reverses the payout when Stripe reports the transfer failed', async () => {
    const payout = {
      id: 'po_s',
      status: 'processing',
      stripeTransferId: 'tr_1',
      creator: { id: 'c1' },
      amount: 7,
      currency: 'usd',
      payoutId: 'payout_c1_s',
    };
    const { service, stripe, walletService } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(payout) },
    });
    stripe.transfers.retrieve.mockResolvedValue({
      id: 'tr_1',
      status: 'failed',
      failure_message: 'account closed',
    });

    await expect(service.syncPayoutWithStripe(payout as any)).resolves.toEqual({
      outcome: 'failed',
    });
    expect(walletService.credit).toHaveBeenCalledWith('c1', 7, {
      purpose: 'payout-transfer-failed',
      type: 'payout_reversal',
      reference: 'payout_c1_s',
    });
  });

  it.each(['pending', undefined])('stays unchanged while the transfer is %s', async (status) => {
    const { service, stripe } = buildPayments({ config: CONNECT_CONFIG });
    stripe.transfers.retrieve.mockResolvedValue(status ? { status } : null);

    await expect(
      service.syncPayoutWithStripe({
        stripeTransferId: 'tr_1',
        status: 'processing',
      } as any)
    ).resolves.toEqual({
      outcome: 'unchanged',
      reason: `stripe-status-${status ?? 'unknown'}`,
    });
  });

  it('locates a transfer by its payoutId metadata', async () => {
    const found = { id: 'tr_9', metadata: { payoutId: 'payout_c1_x' } };
    const { service, stripe } = buildPayments({ config: CONNECT_CONFIG });
    stripe.transfers.list.mockResolvedValue({ data: [found] });

    const result = await service.locateTransferByPayoutId('payout_c1_x', 6);

    expect(stripe.transfers.list).toHaveBeenCalledWith({
      limit: 100,
      created: { gte: expect.any(Number) },
    });
    expect(result).toBe(found);
  });

  it('returns null when no transfer matches the payoutId', async () => {
    const { service, stripe } = buildPayments({ config: CONNECT_CONFIG });
    stripe.transfers.list.mockResolvedValue({ data: [] });

    await expect(service.locateTransferByPayoutId('payout_missing')).resolves.toBeNull();
  });

  it('returns null when the transfer lookup throws', async () => {
    const { service, stripe } = buildPayments({ config: CONNECT_CONFIG });
    stripe.transfers.list.mockRejectedValue(new Error('stripe down'));
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);

    await expect(service.locateTransferByPayoutId('payout_c1_x')).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Reconciliation transfer lookup failed: stripe down')
    );
    warn.mockRestore();
  });

  it('returns null for transfer lookups while Connect is disabled', async () => {
    const { service } = buildPayments({ config: NO_CONNECT_CONFIG });

    await expect(service.locateTransferByPayoutId('payout_c1_x')).resolves.toBeNull();
  });

  it('sums the Stripe balance snapshot in cents', async () => {
    const { service, stripe } = buildPayments({ config: STRIPE_CONFIG });
    stripe.balance.retrieve.mockResolvedValue({
      available: [{ amount: 100 }, { amount: 50 }],
      pending: [{ amount: 20 }],
    });

    await expect(service.getStripeBalanceSnapshot()).resolves.toEqual({
      available: 150,
      pending: 20,
    });
  });

  it('treats a balance without entries as zero', async () => {
    const { service, stripe } = buildPayments({ config: STRIPE_CONFIG });
    stripe.balance.retrieve.mockResolvedValue({});

    await expect(service.getStripeBalanceSnapshot()).resolves.toEqual({
      available: 0,
      pending: 0,
    });
  });

  it('returns null when the balance lookup throws', async () => {
    const { service, stripe } = buildPayments({ config: STRIPE_CONFIG });
    stripe.balance.retrieve.mockRejectedValue(new Error('stripe down'));
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);

    await expect(service.getStripeBalanceSnapshot()).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Stripe balance snapshot failed: stripe down')
    );
    warn.mockRestore();
  });

  it('returns null for a balance snapshot while payments are disabled', async () => {
    const { service } = buildPayments();

    await expect(service.getStripeBalanceSnapshot()).resolves.toBeNull();
  });
});

describe('splitRevenue', () => {
  it('applies the default ten percent platform fee', () => {
    expect(splitRevenue(10)).toEqual({
      gross: 10,
      platformFee: 1,
      recipientAmount: 9,
      feeRate: 0.1,
    });
  });

  it('splits a custom rate with cent precision', () => {
    expect(splitRevenue(9.99, 0.25)).toEqual({
      gross: 9.99,
      platformFee: 2.5,
      recipientAmount: 7.49,
      feeRate: 0.25,
    });
  });

  it('clamps a fee rate above one to one', () => {
    expect(splitRevenue(10, 5)).toEqual({
      gross: 10,
      platformFee: 10,
      recipientAmount: 0,
      feeRate: 1,
    });
  });

  it('clamps a negative fee rate to zero', () => {
    expect(splitRevenue(10, -1)).toEqual({
      gross: 10,
      platformFee: 0,
      recipientAmount: 10,
      feeRate: 0,
    });
  });

  it('treats a NaN fee rate as zero', () => {
    expect(splitRevenue(10, Number.NaN)).toEqual({
      gross: 10,
      platformFee: 0,
      recipientAmount: 10,
      feeRate: 0,
    });
  });

  it('rounds the gross amount to cent precision', () => {
    expect(splitRevenue(10.005).gross).toBe(10.01);
  });
});

describe('PaymentsService edge cases', () => {
  it('confirms a webhook payment whose transaction carries no metadata', async () => {
    const transaction = {
      id: 'tx_n1',
      paymentId: 'pi_n1',
      status: 'pending',
      amount: 10,
      recipient: { id: 'r1' },
    };
    const { service, paymentRepository, walletService } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_n1' } },
    });

    expect(transaction.status).toBe('succeeded');
    expect(walletService.credit).toHaveBeenCalledWith(
      'r1',
      9,
      expect.objectContaining({ purpose: 'payment' })
    );
    expect(paymentRepository.save).toHaveBeenCalledWith(transaction);
  });

  it('skips fulfillment when the payment was already fulfilled', async () => {
    const { service, stripe } = buildPayments({ config: STRIPE_CONFIG });
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_done', status: 'succeeded' });
    const handler = jest.fn();
    service.registerFulfillmentHandler('content_unlock', handler);

    const result = await service.processPayment('u1', 5, 'purchase', {
      recipientId: 'r1',
      metadata: { fulfillmentType: 'content_unlock', fulfillmentStatus: 'completed' },
    });

    expect(result.fulfillmentCompleted).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it('tolerates a corrupt amount while reversing a refund', async () => {
    const transaction = {
      id: 'tx_bad',
      paymentId: 'pi_bad',
      status: 'succeeded',
      amount: Number.NaN,
      recipient: { id: 'r1' },
      metadata: { recipientCredited: 5 },
    };
    const { service, walletService, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_bad', payment_intent: 'pi_bad', amount_refunded: 1000 } },
    });

    expect(walletService.debit).not.toHaveBeenCalled();
    expect(transaction.status).toBe('partially_refunded');
    expect(paymentRepository.save).toHaveBeenCalledWith(transaction);
  });
});

describe('PaymentsService deferred and missing-record paths', () => {
  it('logs a non-Error fulfillment failure without throwing', async () => {
    const { service, walletService, stripe } = buildPayments({
      config: STRIPE_CONFIG,
      wallet: { credit: jest.fn().mockRejectedValue('wallet offline') },
    });
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_str', status: 'succeeded' });

    const result = await service.processPayment('u1', 10, 'tip', { recipientId: 'r1' });

    expect(result.success).toBe(true);
    expect(result.fulfillmentCompleted).toBe(false);
  });

  it('returns without marking a payment whose intent is still processing', async () => {
    const transaction = {
      id: 'tx_p',
      paymentId: 'pi_p',
      payer: { id: 'u1' },
      status: 'pending',
      metadata: {},
    };
    const { service, stripe, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });
    stripe.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_p', status: 'processing' });

    const result = await service.confirmPayment('pi_p', 'u1');

    expect(result).toEqual({
      success: false,
      status: 'processing',
      paymentId: 'pi_p',
      clientSecret: null,
      fulfillmentCompleted: false,
    });
    expect(paymentRepository.save).not.toHaveBeenCalled();
    expect(transaction.status).toBe('pending');
  });

  it('credits an already-succeeded webhook payment that has no metadata', async () => {
    const transaction = {
      id: 'tx_n2',
      paymentId: 'pi_n2',
      status: 'succeeded',
      amount: 10,
      recipient: { id: 'r2' },
    };
    const { service, walletService, paymentRepository } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_n2' } },
    });

    expect(walletService.credit).toHaveBeenCalledWith(
      'r2',
      9,
      expect.objectContaining({ purpose: 'payment' })
    );
    expect(paymentRepository.save).toHaveBeenCalledWith(transaction);
  });

  it('stores a demo transaction without a recipient when none is supplied', async () => {
    const { service, paymentRepository } = buildPayments();

    await service.createDemoPaymentScenario(5, 'usd', '', 'payer-1');

    const stored = paymentRepository.create.mock.calls[0][0];
    expect(stored.recipient).toBeNull();
    expect(stored.payer).toEqual({ id: 'payer-1' });
  });

  it('falls back to a generic reason when approvePayout hits a messageless transfer error', async () => {
    const payout = {
      id: 'po_n1',
      status: 'processing',
      creator: { id: 'c1', stripeConnectAccountId: 'acct_ok', payoutsEnabled: true },
      amount: 30,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_n1',
    };
    const stored = { ...payout, status: 'failed', failureReason: 'Stripe transfer failed' };
    const { service, stripe, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: { findOne: jest.fn().mockResolvedValue(stored) },
    });
    stripe.transfers.create.mockRejectedValue(null);

    const result = await service.approvePayout('po_n1');

    expect(payoutRepository.update).toHaveBeenCalledWith(
      { id: 'po_n1', status: 'processing' },
      expect.objectContaining({ failureReason: 'Stripe transfer failed' })
    );
    expect(result.status).toBe('failed');
  });

  it('returns the stored payout when the Stripe paid patch does not apply', async () => {
    const stored = {
      id: 'po_n2',
      status: 'processing',
      creator: { id: 'c1', stripeConnectAccountId: 'acct_ok', payoutsEnabled: true },
      amount: 30,
      currency: 'usd',
      purpose: 'withdrawal',
      payoutId: 'payout_c1_n2',
    };
    let call = 0;
    const { service, stripe, payoutRepository } = buildPayments({
      config: CONNECT_CONFIG,
      payouts: {
        findOne: jest.fn().mockResolvedValue(stored),
        update: jest.fn().mockImplementation(async () => {
          call += 1;
          return call === 1 ? { affected: 1 } : { affected: 0 };
        }),
      },
    });
    stripe.transfers.create.mockResolvedValue({ id: 'tr_n2' });

    const result = await service.approvePayout('po_n2');

    expect(result.status).toBe('processing');
    expect(result.mode).toBe('stripe');
    expect(payoutRepository.update).toHaveBeenCalledTimes(2);
  });

  it('reports a vanished payout when the claim finds no record', async () => {
    const { service, payoutRepository } = buildPayments({
      payouts: {
        update: jest.fn().mockResolvedValue({ affected: 0 }),
        findOne: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(service.approvePayout('po_gone')).rejects.toThrow('Payout not found');
    expect(payoutRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'po_gone' },
      relations: ['creator'],
    });
  });

  it('stops a replayed partial refund whose delta is already exhausted', async () => {
    const transaction = {
      id: 'tx_rep',
      paymentId: 'pi_rep',
      status: 'partially_refunded',
      amount: 10,
      metadata: { refundedGross: 5 },
    };
    const { service, paymentRepository, walletService } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_rep', payment_intent: 'pi_rep', amount_refunded: 500 } },
    });

    expect(paymentRepository.save).not.toHaveBeenCalled();
    expect(walletService.debit).not.toHaveBeenCalled();
    expect(transaction.metadata.refundedGross).toBe(5);
  });

  it('reverses a refund on a transaction that carries no metadata', async () => {
    const transaction = {
      id: 'tx_nm',
      paymentId: 'pi_nm',
      status: 'succeeded',
      amount: 10,
    };
    const { service, paymentRepository, walletService } = buildPayments({
      config: STRIPE_CONFIG,
      payments: { findOne: jest.fn().mockResolvedValue(transaction) },
    });

    await service.handleWebhookEvent({
      type: 'charge.refunded',
      data: { object: { id: 'ch_nm', payment_intent: 'pi_nm', amount_refunded: 1000 } },
    });

    expect(walletService.debit).not.toHaveBeenCalled();
    expect(transaction.status).toBe('refunded');
    expect(paymentRepository.save).toHaveBeenCalledWith(transaction);
  });

  it('reports a generic reason when the reconciliation transfer lookup throws without a message', async () => {
    const { service, stripe } = buildPayments({ config: CONNECT_CONFIG });
    stripe.transfers.retrieve.mockRejectedValue(null);

    await expect(
      service.syncPayoutWithStripe({ stripeTransferId: 'tr_1', status: 'processing' } as any)
    ).resolves.toEqual({ outcome: 'unchanged', reason: 'retrieve-failed: unknown' });
  });

  it('treats balance entries without amounts as zero', async () => {
    const { service, stripe } = buildPayments({ config: STRIPE_CONFIG });
    stripe.balance.retrieve.mockResolvedValue({ available: [{}], pending: [{}] });

    await expect(service.getStripeBalanceSnapshot()).resolves.toEqual({
      available: 0,
      pending: 0,
    });
  });
});
