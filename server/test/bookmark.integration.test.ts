/**
 * Integration tests for bookmarks and collections endpoints.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { BookmarksController } from '../src/bookmarks/bookmarks.controller';
import { CollectionsController } from '../src/bookmarks/collections.controller';
import { BookmarksService } from '../src/bookmarks/bookmarks.service';
import { LoginSession } from '../src/auth/entities/login-session.entity';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

function createModule(bookmarkOverrides: Record<string, jest.Mock> = {}) {
  const defaultBookmarkService: Record<string, jest.Mock> = {
    create: jest.fn(), findAll: jest.fn(), remove: jest.fn(),
    createCollection: jest.fn(), findAllCollections: jest.fn(),
    findOneCollection: jest.fn(), updateCollection: jest.fn(), removeCollection: jest.fn(),
  };

  return Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test-secret' })],
    controllers: [BookmarksController, CollectionsController],
    providers: [
      { provide: BookmarksService, useValue: { ...defaultBookmarkService, ...bookmarkOverrides } },
      { provide: ConfigService, useValue: { get: (key: string) => key === 'JWT_SECRET' ? 'test-secret' : undefined } },
      { provide: getRepositoryToken(LoginSession), useValue: { findOne: jest.fn().mockResolvedValue({ id: 's1', revokedAt: null }), update: jest.fn() } },
      JwtStrategy,
    ],
  }).compile();
}

async function buildApp(overrides: Record<string, jest.Mock> = {}) {
  const ref = await createModule(overrides);
  const app = ref.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
  const token = app.get(JwtService).sign({ sub: 'user-1', sid: 's1' });
  return { app, service: app.get(BookmarksService) as jest.Mocked<BookmarksService>, token };
}

// ─── Bookmarks ──────────────────────────────────────────────────────────

describe('POST /bookmarks', () => {
  it('returns 201 when bookmark created', async () => {
    const { app, service, token } = await buildApp();
    service.create.mockResolvedValue({ id: 'bm-1' } as any);

    const r = await request(app.getHttpServer())
      .post('/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId: '550e8400-e29b-41d4-a716-446655440001' });

    expect(r.status).toBe(201);
    expect(service.create).toHaveBeenCalled();
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).post('/bookmarks').send({ postId: 'post-1' });
    expect(r.status).toBe(401);
    await app.close();
  });
});

describe('GET /bookmarks', () => {
  it('returns 200 with bookmarks list', async () => {
    const { app, service, token } = await buildApp();
    service.findAll.mockResolvedValue([{ id: 'bm-1', post: { id: 'post-1' } }] as any);

    const r = await request(app.getHttpServer()).get('/bookmarks').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    await app.close();
  });
});

describe('DELETE /bookmarks/:postId', () => {
  it('returns 200 when removed', async () => {
    const { app, service, token } = await buildApp();
    service.remove.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer()).delete('/bookmarks/post-1').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(service.remove).toHaveBeenCalled();
    await app.close();
  });
});

// ─── Collections ────────────────────────────────────────────────────────

describe('POST /collections', () => {
  it('returns 201 when collection created', async () => {
    const { app, service, token } = await buildApp();
    service.createCollection.mockResolvedValue({ id: 'col-1', name: 'Favorites' } as any);

    const r = await request(app.getHttpServer())
      .post('/collections')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Favorites' });

    expect(r.status).toBe(201);
    expect(r.body.name).toBe('Favorites');
    await app.close();
  });
});

describe('GET /collections', () => {
  it('returns 200 with collections list', async () => {
    const { app, service, token } = await buildApp();
    service.findAllCollections.mockResolvedValue([{ id: 'col-1', name: 'Favorites' }] as any);

    const r = await request(app.getHttpServer()).get('/collections').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    await app.close();
  });
});

describe('PATCH /collections/:id', () => {
  it('returns 200 when updated', async () => {
    const { app, service, token } = await buildApp();
    service.updateCollection.mockResolvedValue({ id: 'col-1', name: 'Renamed' } as any);

    const r = await request(app.getHttpServer())
      .patch('/collections/col-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed' });

    expect(r.status).toBe(200);
    expect(service.updateCollection).toHaveBeenCalled();
    await app.close();
  });
});

describe('DELETE /collections/:id', () => {
  it('returns 200 when deleted', async () => {
    const { app, service, token } = await buildApp();
    service.removeCollection.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer()).delete('/collections/col-1').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(service.removeCollection).toHaveBeenCalled();
    await app.close();
  });
});
