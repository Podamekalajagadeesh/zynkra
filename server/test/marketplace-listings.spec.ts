/**
 * Marketplace listings — service logic + controller wiring.
 *
 * The `MarketplaceListing` entity and `marketplace_listings` table already
 * existed (created by the Baseline migration), but no controller route or
 * service method did, so the five client calls in `client/src/lib/api.ts`
 * (`getMarketplaceListings` … `deleteMarketplaceListing`) all 404'd. These
 * tests pin the routes and the seller-ownership rules.
 */

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import request from 'supertest';

import { MarketplaceController } from '../src/marketplace/marketplace.controller';
import { MarketplaceService } from '../src/marketplace/marketplace.service';
import { Transaction } from '../src/marketplace/entities/transaction.entity';
import { Rating } from '../src/marketplace/entities/rating.entity';
import { MarketplaceListing } from '../src/marketplace/entities/listing.entity';
import { User } from '../src/users/entities/user.entity';
import { LoginSession } from '../src/auth/entities/login-session.entity';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

const SELLER_ID = '550e8400-e29b-41d4-a716-4466554400aa';
const OTHER_ID = '550e8400-e29b-41d4-a716-4466554400bb';
const LISTING_ID = '550e8400-e29b-41d4-a716-4466554400cc';

function buildService(overrides: Record<string, any> = {}) {
  const listingRepository = {
    create: jest.fn((dto: any) => ({ id: LISTING_ID, ...dto })),
    save: jest.fn(async (entity: any) => entity),
    findOne: jest.fn(async () => null),
    remove: jest.fn(async (entity: any) => entity),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    })),
    ...overrides.listingRepository,
  };

  const userRepository = {
    // Echoes the requested id back, the way a real repository would. A fixed
    // return value here would make JwtStrategy resolve *every* token's subject
    // to the same user and quietly defeat the ownership assertions below.
    findOne: jest.fn(async (opts: any) => ({ id: opts?.where?.id ?? SELLER_ID })),
    save: jest.fn(async (user: any) => user),
    ...overrides.userRepository,
  };

  return {
    service: new MarketplaceService(
      { findOne: jest.fn(), save: jest.fn(), create: jest.fn() } as any,
      { findOne: jest.fn(), save: jest.fn(), create: jest.fn() } as any,
      listingRepository as any,
      userRepository as any,
    ),
    listingRepository,
    userRepository,
  };
}

function ownedListing(sellerId = SELLER_ID) {
  return { id: LISTING_ID, seller: { id: sellerId }, title: 'Desk', price: 10 } as any;
}

describe('MarketplaceService listings', () => {
  describe('createListing', () => {
    it('applies defaults for optional fields', async () => {
      const { service, listingRepository } = buildService();
      await service.createListing({ title: '  Desk  ', price: 25 } as any, SELLER_ID);
      const created = listingRepository.create.mock.calls[0][0];
      expect(created.title).toBe('Desk');
      expect(created.description).toBe('');
      expect(created.location).toBe('');
      expect(created.imageUrls).toEqual([]);
    });

    it('throws NotFound when the seller does not exist', async () => {
      const { service } = buildService({ userRepository: { findOne: jest.fn(async () => null) } });
      await expect(service.createListing({ title: 'Desk', price: 1 } as any, SELLER_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findOneListing', () => {
    it('throws NotFound for an unknown id', async () => {
      const { service, listingRepository } = buildService();
      await expect(service.findOneListing(LISTING_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the listing when present', async () => {
      const { service, listingRepository } = buildService({ listingRepository: { findOne: jest.fn(async () => ownedListing()) } });
      await expect(service.findOneListing(LISTING_ID)).resolves.toMatchObject({ id: LISTING_ID });
    });
  });

  describe('updateListing', () => {
    it('lets the seller update', async () => {
      const { service, listingRepository } = buildService({ listingRepository: { findOne: jest.fn(async () => ownedListing()) } });
      await service.updateListing(LISTING_ID, { price: 99 } as any, SELLER_ID);
      expect(listingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: LISTING_ID, price: 99 }),
      );
    });

    it('forbids a non-seller', async () => {
      const { service, listingRepository } = buildService({ listingRepository: { findOne: jest.fn(async () => ownedListing()) } });
      await expect(service.updateListing(LISTING_ID, { price: 1 } as any, OTHER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws NotFound before the ownership check', async () => {
      const { service, listingRepository } = buildService();
      await expect(service.updateListing(LISTING_ID, { price: 1 } as any, OTHER_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('ignores fields absent from the patch', async () => {
      const { service, listingRepository } = buildService({ listingRepository: { findOne: jest.fn(async () => ownedListing()) } });
      await service.updateListing(LISTING_ID, { price: 42 } as any, SELLER_ID);
      expect(listingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Desk' }),
      );
    });
  });

  describe('removeListing', () => {
    it('lets the seller delete', async () => {
      const { service, listingRepository } = buildService({ listingRepository: { findOne: jest.fn(async () => ownedListing()) } });
      await service.removeListing(LISTING_ID, SELLER_ID);
      expect(listingRepository.remove).toHaveBeenCalled();
    });

    it('forbids a non-seller', async () => {
      const { service, listingRepository } = buildService({ listingRepository: { findOne: jest.fn(async () => ownedListing()) } });
      await expect(service.removeListing(LISTING_ID, OTHER_ID)).rejects.toBeInstanceOf(ForbiddenException);
      expect(listingRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('findAllListings', () => {
    it('does not filter when no query is given', async () => {
      const { service, listingRepository } = buildService();
      await service.findAllListings();
      const qb = listingRepository.createQueryBuilder.mock.results[0].value;
      expect(qb.where).not.toHaveBeenCalled();
    });

    it('applies an ILIKE filter when a query is given', async () => {
      const { service, listingRepository } = buildService();
      await service.findAllListings('  desk  ');
      const qb = listingRepository.createQueryBuilder.mock.results[0].value;
      expect(qb.where).toHaveBeenCalledWith('listing.title ILIKE :term', { term: '%desk%' });
      expect(qb.orWhere).toHaveBeenCalledWith('listing.description ILIKE :term', { term: '%desk%' });
    });
  });
});

// ─── Controller wiring ──────────────────────────────────────────────────

async function buildApp(overrides: Record<string, any> = {}, subject = SELLER_ID) {
  const repos = buildService(overrides);
  const ref = await Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test-secret' })],
    controllers: [MarketplaceController],
    providers: [
      MarketplaceService,
      {
        provide: ConfigService,
        useValue: { get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined) },
      },
      { provide: getRepositoryToken(Transaction), useValue: {} },
      { provide: getRepositoryToken(Rating), useValue: {} },
      { provide: getRepositoryToken(MarketplaceListing), useValue: repos.listingRepository },
      { provide: getRepositoryToken(User), useValue: repos.userRepository },
      {
        provide: getRepositoryToken(LoginSession),
        useValue: { findOne: jest.fn().mockResolvedValue({ id: 's1', revokedAt: null }), update: jest.fn() },
      },
      JwtStrategy,
    ],
  }).compile();

  const app: INestApplication = ref.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
  const token = app.get(JwtService).sign({ sub: subject, sid: 's1' });
  return { app, token };
}

describe('listings routes', () => {
  it('GET /marketplace/listings requires auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).get('/marketplace/listings');
    expect(r.status).toBe(401);
    await app.close();
  });

  it('POST /marketplace/listings returns 201', async () => {
    const { app, token } = await buildApp();
    const r = await request(app.getHttpServer())
      .post('/marketplace/listings')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Desk', price: 25 });
    expect(r.status).toBe(201);
    await app.close();
  });

  it('POST /marketplace/listings rejects a negative price', async () => {
    const { app, token } = await buildApp();
    const r = await request(app.getHttpServer())
      .post('/marketplace/listings')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Desk', price: -5 });
    expect(r.status).toBe(400);
    await app.close();
  });

  it('GET /marketplace/listings/:id returns 404 for an unknown id', async () => {
    const { app, token } = await buildApp();
    const r = await request(app.getHttpServer())
      .get(`/marketplace/listings/${LISTING_ID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(404);
    await app.close();
  });

  it('DELETE /marketplace/listings/:id returns 204 for the seller', async () => {
    const { app, token } = await buildApp({
      listingRepository: { findOne: jest.fn(async () => ownedListing()) },
    });
    const r = await request(app.getHttpServer())
      .delete(`/marketplace/listings/${LISTING_ID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(204);
    await app.close();
  });

  it('DELETE /marketplace/listings/:id returns 403 for a non-seller', async () => {
    const { app, token } = await buildApp(
      { listingRepository: { findOne: jest.fn(async () => ownedListing()) } },
      OTHER_ID,
    );
    const r = await request(app.getHttpServer())
      .delete(`/marketplace/listings/${LISTING_ID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(403);
    await app.close();
  });
});