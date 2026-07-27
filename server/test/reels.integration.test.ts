/**
 * Integration tests for reels endpoints.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { ReelsController } from '../src/reels/reels.controller';
import { ReelsService } from '../src/reels/reels.service';
import { LoginSession } from '../src/auth/entities/login-session.entity';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

function createModule(overrides: Record<string, jest.Mock> = {}) {
  const defaultService: Record<string, jest.Mock> = {
    getReelById: jest.fn(), getReelSuggestions: jest.fn(), getReelEffects: jest.fn(),
    shareReel: jest.fn(), trackView: jest.fn(), getReelInsights: jest.fn(),
    createReel: jest.fn(), updateReel: jest.fn(), deleteReel: jest.fn(),
    getUserReels: jest.fn(), createReelEffect: jest.fn(), updateReelEffect: jest.fn(),
    deleteReelEffect: jest.fn(),
  };

  return Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test-secret' })],
    controllers: [ReelsController],
    providers: [
      { provide: ReelsService, useValue: { ...defaultService, ...overrides } },
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
  return { app, service: app.get(ReelsService) as jest.Mocked<ReelsService>, token };
}

describe('GET /reels/:id', () => {
  it('returns 200 with reel', async () => {
    const { app, service, token } = await buildApp();
    service.getReelById.mockResolvedValue({ id: 'post-1', content: 'Reel' } as any);

    const r = await request(app.getHttpServer()).get('/reels/post-1').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    await app.close();
  });
});

describe('GET /reels/effects', () => {
  it('returns 200 with effects list', async () => {
    const { app, service, token } = await buildApp();
    service.getReelEffects.mockResolvedValue([{ id: 'e1', name: 'Neon' }] as any);

    const r = await request(app.getHttpServer()).get('/reels/effects').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    await app.close();
  });
});

describe('POST /reels/:id/share', () => {
  it('returns 201 when shared', async () => {
    const { app, service, token } = await buildApp();
    service.shareReel.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer()).post('/reels/post-1/share').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(201);
    expect(service.shareReel).toHaveBeenCalled();
    await app.close();
  });
});

describe('POST /reels/:id/view', () => {
  it('returns 201 when view tracked', async () => {
    const { app, service, token } = await buildApp();
    service.trackView.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer()).post('/reels/post-1/view').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(201);
    expect(service.trackView).toHaveBeenCalled();
    await app.close();
  });
});

describe('DELETE /reels/:id', () => {
  it('returns 200 when deleted', async () => {
    const { app, service, token } = await buildApp();
    service.deleteReel.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer()).delete('/reels/post-1').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).delete('/reels/post-1');
    expect(r.status).toBe(401);
    await app.close();
  });
});
