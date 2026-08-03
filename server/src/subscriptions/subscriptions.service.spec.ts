import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionTier } from './entities/subscription-tier.entity';
import {
  SubscriptionBundle,
  SubscriptionBundleTier,
} from './entities/subscription-bundle.entity';
import { UsersService } from '../users/users.service';
import { PaymentsService } from '../payments/payments.service';

describe('SubscriptionsService (bundles)', () => {
  let service: SubscriptionsService;
  let subscriptionsRepo: jest.Mocked<any>;
  let tiersRepo: jest.Mocked<any>;
  let bundlesRepo: jest.Mocked<any>;
  let bundleTiersRepo: jest.Mocked<any>;
  let usersService: jest.Mocked<any>;
  let paymentsService: jest.Mocked<any>;

  const creator = { id: 'creator-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(SubscriptionTier),
          useValue: { find: jest.fn(), findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(SubscriptionBundle),
          useValue: { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() },
        },
        {
          provide: getRepositoryToken(SubscriptionBundleTier),
          useValue: { create: jest.fn(), save: jest.fn(), remove: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findOneById: jest.fn() },
        },
        {
          provide: PaymentsService,
          useValue: { processPayment: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionsRepo = module.get(getRepositoryToken(Subscription));
    tiersRepo = module.get(getRepositoryToken(SubscriptionTier));
    bundlesRepo = module.get(getRepositoryToken(SubscriptionBundle));
    bundleTiersRepo = module.get(getRepositoryToken(SubscriptionBundleTier));
    usersService = module.get(UsersService);
    paymentsService = module.get(PaymentsService);
  });

  describe('createBundle', () => {
    it('rejects a price above the sum of its tiers', async () => {
      usersService.findOneById.mockResolvedValue(creator);
      tiersRepo.find.mockResolvedValue([
        { id: 't1', price: 5, creator: { id: 'creator-1' } },
        { id: 't2', price: 5, creator: { id: 'creator-1' } },
      ]);

      await expect(
        service.createBundle('creator-1', {
          name: 'All access',
          price: 12,
          tierIds: ['t1', 't2'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a bundle when price is within the tier total', async () => {
      usersService.findOneById.mockResolvedValue(creator);
      tiersRepo.find.mockResolvedValue([
        { id: 't1', price: 5, creator: { id: 'creator-1' } },
        { id: 't2', price: 5, creator: { id: 'creator-1' } },
      ]);
      bundlesRepo.create.mockReturnValue({ id: 'bundle-1' });
      bundlesRepo.save.mockResolvedValue({ id: 'bundle-1' });
      bundlesRepo.findOne.mockResolvedValue({
        id: 'bundle-1',
        creator,
        name: 'All access',
        tiers: [],
      });
      bundleTiersRepo.create.mockImplementation((data) => ({ ...data, id: Math.random().toString() }));

      const result = await service.createBundle('creator-1', {
        name: 'All access',
        price: 9,
        tierIds: ['t1', 't2'],
      });

      expect(result.id).toBe('bundle-1');
      expect(bundlesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ price: 9, isActive: true }),
      );
    });
  });

  describe('purchaseBundle', () => {
    it('is idempotent — returns the existing active subscription', async () => {
      bundlesRepo.findOne.mockResolvedValue({
        id: 'bundle-1',
        creator,
        isActive: true,
        price: 9,
        name: 'All access',
      });
      subscriptionsRepo.findOne.mockResolvedValue({ id: 'existing-sub' });

      const result = await service.purchaseBundle('subscriber-1', 'bundle-1');

      expect(result).toEqual({ id: 'existing-sub' });
      expect(paymentsService.processPayment).not.toHaveBeenCalled();
    });

    it('charges the bundle price once and creates an active subscription', async () => {
      bundlesRepo.findOne.mockResolvedValue({
        id: 'bundle-1',
        creator,
        isActive: true,
        price: 9,
        name: 'All access',
      });
      subscriptionsRepo.findOne.mockResolvedValue(null);
      usersService.findOneById.mockResolvedValue({ id: 'subscriber-1' });
      subscriptionsRepo.create.mockReturnValue({ id: 'sub-1' });
      subscriptionsRepo.save.mockResolvedValue({ id: 'sub-1' });

      const result = await service.purchaseBundle('subscriber-1', 'bundle-1');

      expect(paymentsService.processPayment).toHaveBeenCalledWith(
        'subscriber-1',
        9,
        'subscription',
        expect.objectContaining({
          metadata: expect.objectContaining({ bundleId: 'bundle-1' }),
        }),
      );
      expect(subscriptionsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 'bundle:All access' }),
      );
      expect(result.id).toBe('sub-1');
    });
  });
});
