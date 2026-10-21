import { NotFoundException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { PaymentsService } from '../payments/payments.service';

describe('WebhooksService', () => {
  let endpointsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let deliveriesRepository: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let paymentsService: { constructWebhookEvent: jest.Mock; handleWebhookEvent: jest.Mock };
  let service: WebhooksService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    endpointsRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((input: object) => ({ ...input })),
      save: jest.fn(async (row: object) => row),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    deliveriesRepository = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((input: object) => ({ ...input })),
      save: jest.fn(async (row: object) => row),
      update: jest.fn().mockResolvedValue(undefined),
    };
    paymentsService = {
      constructWebhookEvent: jest.fn(),
      handleWebhookEvent: jest.fn(),
    };
    service = new WebhooksService(
      endpointsRepository as never,
      deliveriesRepository as never,
      paymentsService as never
    );
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200 } as never);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('endpoint management', () => {
    it('creates an endpoint storing only a hash of the secret and returning it once', async () => {
      endpointsRepository.save.mockImplementation(async (row: object) => ({ id: 'e1', ...row }));

      const created = await service.createEndpoint('dev1', {
        url: 'https://dev.example.com/hook',
        events: ['payment.succeeded'],
      } as never);

      expect(created.secret).toEqual(expect.any(String));
      expect(created.secret).toHaveLength(43); // 32 random bytes, base64url
      const stored = endpointsRepository.create.mock.calls[0][0];
      expect(stored.secretHash).toEqual(expect.any(String));
      expect(stored.secretHash).not.toBe(created.secret);
      expect(stored.active).toBe(true);
      expect(stored.developer).toEqual({ id: 'dev1' });
    });

    it('lists endpoints for the developer newest-first', async () => {
      await service.listEndpoints('dev1');
      expect(endpointsRepository.find).toHaveBeenCalledWith({
        where: { developer: { id: 'dev1' } },
        order: { createdAt: 'DESC' },
      });
    });

    it('applies only the provided fields on update', async () => {
      const endpoint = { id: 'e1', url: 'https://a', events: ['x'], active: true };
      endpointsRepository.findOne.mockResolvedValue(endpoint);

      await service.updateEndpoint('dev1', 'e1', { events: ['y', 'z'] } as never);

      expect(endpoint).toEqual({ id: 'e1', url: 'https://a', events: ['y', 'z'], active: true });
      expect(endpointsRepository.save).toHaveBeenCalledWith(endpoint);
    });

    it('refuses to touch an endpoint the developer does not own', async () => {
      endpointsRepository.findOne.mockResolvedValue(null);
      await expect(service.updateEndpoint('dev1', 'e1', {} as never)).rejects.toBeInstanceOf(
        NotFoundException
      );
      await expect(service.deleteEndpoint('dev1', 'e1')).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.rotateSecret('dev1', 'e1')).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.getDeliveries('dev1', 'e1')).rejects.toBeInstanceOf(NotFoundException);
      expect(endpointsRepository.save).not.toHaveBeenCalled();
      expect(endpointsRepository.remove).not.toHaveBeenCalled();
    });

    it('deletes an owned endpoint', async () => {
      const endpoint = { id: 'e1' };
      endpointsRepository.findOne.mockResolvedValue(endpoint);
      await service.deleteEndpoint('dev1', 'e1');
      expect(endpointsRepository.remove).toHaveBeenCalledWith(endpoint);
    });

    it('rotating the secret re-hashes and stores a new hash', async () => {
      const endpoint = { id: 'e1', secretHash: 'old' };
      endpointsRepository.findOne.mockResolvedValue(endpoint);

      const { secret } = await service.rotateSecret('dev1', 'e1');

      expect(secret).toEqual(expect.any(String));
      expect(endpoint.secretHash).not.toBe('old');
      expect(endpointsRepository.save).toHaveBeenCalledWith(endpoint);
    });

    it('caps delivery history at the 50 most recent', async () => {
      endpointsRepository.findOne.mockResolvedValue({ id: 'e1' });
      await service.getDeliveries('dev1', 'e1');
      expect(deliveriesRepository.find).toHaveBeenCalledWith({
        where: { endpoint: { id: 'e1' } },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });
  });

  describe('dispatchEvent', () => {
    function makeEndpoint(overrides: Partial<Record<string, unknown>> = {}) {
      return {
        id: 'e1',
        url: 'https://dev.example.com/hook',
        events: ['payment.succeeded'],
        secretHash: 'hash-1',
        active: true,
        ...overrides,
      } as never;
    }

    function makeDelivery(endpoint: unknown) {
      return {
        id: 'd1',
        event: 'payment.succeeded',
        payload: { amount: 100 },
        status: 'pending',
        retries: 0,
        endpoint,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
    }

    it('delivers only to active endpoints subscribed to the event', async () => {
      const subscribed = makeEndpoint();
      const inactiveSubscribed = makeEndpoint({ id: 'e3', active: false });
      const unsubscribed = makeEndpoint({ id: 'e2', events: ['other.event'] });
      // emulate TypeORM's active-only where clause the service relies on
      endpointsRepository.find.mockImplementation(
        async ({ where }: { where?: { active?: boolean } }) =>
          (
            [subscribed, unsubscribed, inactiveSubscribed] as Array<{
              active: boolean;
              events: string[];
            }>
          ).filter((e) => where?.active === undefined || e.active === where.active)
      );
      deliveriesRepository.save.mockImplementation(async (row: { endpoint: { id: string } }) => ({
        id: `d-${row.endpoint.id}`,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        event: 'payment.succeeded',
        payload: { amount: 100 },
        endpoint: row.endpoint,
      }));

      await service.dispatchEvent('payment.succeeded', { amount: 100 });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0][0]).toBe('https://dev.example.com/hook');
    });

    it('skips the network entirely when nobody subscribes', async () => {
      endpointsRepository.find.mockResolvedValue([makeEndpoint({ events: ['other'] })]);
      await service.dispatchEvent('payment.succeeded', {});
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(deliveriesRepository.save).not.toHaveBeenCalled();
    });

    it('signs the delivery body and marks it delivered on a 2xx response', async () => {
      const endpoint = makeEndpoint();
      endpointsRepository.find.mockResolvedValue([endpoint]);
      const delivery = makeDelivery(endpoint);
      deliveriesRepository.save.mockResolvedValue(delivery);

      await service.dispatchEvent('payment.succeeded', { amount: 100 });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers['x-zynkra-event']).toBe('payment.succeeded');
      expect(headers['x-zynkra-signature']).toMatch(/^sha256=[0-9a-f]{64}$/);
      expect(headers['user-agent']).toBe('zynkra-webhooks/1.0');
      expect(JSON.parse(init.body as string)).toEqual({
        id: 'd1',
        event: 'payment.succeeded',
        createdAt: '2026-01-01T00:00:00.000Z',
        data: { amount: 100 },
      });
      expect(deliveriesRepository.update).toHaveBeenCalledWith('d1', {
        status: 'delivered',
        deliveredAt: expect.any(Date),
        lastError: null,
      });
    });

    it('marks the delivery failed and counts a retry when the receiver rejects it', async () => {
      const endpoint = makeEndpoint();
      endpointsRepository.find.mockResolvedValue([endpoint]);
      deliveriesRepository.save.mockResolvedValue(makeDelivery(endpoint));
      fetchSpy.mockResolvedValue({ ok: false, status: 500 } as never);

      await service.dispatchEvent('payment.succeeded', { amount: 100 });

      expect(deliveriesRepository.update).toHaveBeenCalledWith('d1', {
        status: 'failed',
        retries: 1,
      });
    });

    it('keeps one failing endpoint from sinking the whole dispatch', async () => {
      endpointsRepository.find.mockResolvedValue([
        makeEndpoint({ id: 'e1', url: 'https://bad.example.com' }),
        makeEndpoint({ id: 'e2', url: 'https://good.example.com' }),
      ]);
      deliveriesRepository.save.mockImplementation(async (row: { endpoint: { id: string } }) => ({
        id: `d-${row.endpoint.id}`,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        event: 'payment.succeeded',
        payload: {},
        retries: 0,
        endpoint: row.endpoint,
      }));
      fetchSpy
        .mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
        .mockResolvedValueOnce({ ok: true, status: 200 } as never);

      await expect(service.dispatchEvent('payment.succeeded', {})).resolves.toBeUndefined();
      expect(deliveriesRepository.update).toHaveBeenCalledTimes(2);
      expect(deliveriesRepository.update).toHaveBeenCalledWith('d-e1', {
        status: 'failed',
        retries: 1,
      });
      expect(deliveriesRepository.update).toHaveBeenCalledWith(
        'd-e2',
        expect.objectContaining({ status: 'delivered' })
      );
    });
  });

  describe('retryFailedDeliveries', () => {
    it('retries failed deliveries under the cap and skips exhausted or inactive ones', async () => {
      const active = {
        id: 'e1',
        url: 'https://a.example.com',
        secretHash: 'h',
        active: true,
        events: [],
      };
      deliveriesRepository.find.mockResolvedValue([
        { id: 'd1', retries: 1, endpoint: active, createdAt: new Date(), event: 'e', payload: {} },
        { id: 'd2', retries: 5, endpoint: active, createdAt: new Date(), event: 'e', payload: {} },
        {
          id: 'd3',
          retries: 1,
          endpoint: { ...active, active: false },
          createdAt: new Date(),
          event: 'e',
          payload: {},
        },
      ]);

      await service.retryFailedDeliveries();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0][0]).toBe('https://a.example.com');
      expect(deliveriesRepository.update).toHaveBeenCalledWith(
        'd1',
        expect.objectContaining({ status: 'delivered' })
      );
    });
  });

  describe('handleStripeWebhook', () => {
    it('verifies the signature and forwards the parsed event to PaymentsService', async () => {
      const event = { type: 'payment_intent.succeeded', id: 'evt_1' };
      paymentsService.constructWebhookEvent.mockReturnValue(event);
      paymentsService.handleWebhookEvent.mockResolvedValue({ handled: true });

      await expect(service.handleStripeWebhook(Buffer.from('{}'), 'sig')).resolves.toEqual({
        handled: true,
      });
      expect(paymentsService.constructWebhookEvent).toHaveBeenCalledWith(Buffer.from('{}'), 'sig');
      expect(paymentsService.handleWebhookEvent).toHaveBeenCalledWith(event);
    });
  });
});
