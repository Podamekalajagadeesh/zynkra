/**
 * Integration tests for stories endpoints.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { StoriesController } from '../src/stories/stories.controller';
import { StoriesService } from '../src/stories/stories.service';
import { StoriesReactionController } from '../src/stories/stories-reaction.controller';
import { StoriesReactionService } from '../src/stories/stories-reaction.service';
import { StoriesReplyController } from '../src/stories/stories-reply.controller';
import { StoriesReplyService } from '../src/stories/stories-reply.service';
import { LoginSession } from '../src/auth/entities/login-session.entity';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

function createModule(overrides: Record<string, any> = {}) {
  const defaults: Record<string, jest.Mock> = {
    create: jest.fn(), findOne: jest.fn(), findActiveStoriesForUser: jest.fn(),
    trackView: jest.fn(), getViews: jest.fn(), delete: jest.fn(),
    addReaction: jest.fn(), addReply: jest.fn(),
  };

  return Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test-secret' })],
    controllers: [StoriesController, StoriesReactionController, StoriesReplyController],
    providers: [
      { provide: StoriesService, useValue: { ...defaults, ...overrides.stories } },
      { provide: StoriesReactionService, useValue: { addReaction: overrides.addReaction || jest.fn() } },
      { provide: StoriesReplyService, useValue: { addReply: overrides.addReply || jest.fn() } },
      { provide: ConfigService, useValue: { get: (key: string) => key === 'JWT_SECRET' ? 'test-secret' : undefined } },
      { provide: getRepositoryToken(LoginSession), useValue: { findOne: jest.fn().mockResolvedValue({ id: 's1', revokedAt: null }), update: jest.fn() } },
      JwtStrategy,
    ],
  }).compile();
}

async function buildApp(overrides: Record<string, any> = {}) {
  const ref = await createModule(overrides);
  const app = ref.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
  const token = app.get(JwtService).sign({ sub: 'user-1', sid: 's1' });
  return { app, storiesService: app.get(StoriesService) as jest.Mocked<StoriesService>, token };
}

describe('GET /stories', () => {
  it('returns 200 with active stories', async () => {
    const { app, storiesService, token } = await buildApp();
    storiesService.findActiveStoriesForUser.mockResolvedValue([
      { id: 'story-1', mediaUrl: '/img.jpg' },
    ] as any);

    const r = await request(app.getHttpServer()).get('/stories').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).get('/stories');
    expect(r.status).toBe(401);
    await app.close();
  });
});

describe('POST /stories/:id/view', () => {
  it('returns 201 when view tracked', async () => {
    const { app, storiesService, token } = await buildApp();
    storiesService.trackView.mockResolvedValue(undefined as any);

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/view')
      .set('Authorization', `Bearer ${token}`)
      .send({ isAnonymous: false });

    expect(r.status).toBe(201);
    expect(storiesService.trackView).toHaveBeenCalled();
    await app.close();
  });
});

describe('GET /stories/:id/views', () => {
  it('returns 200 with views for owner', async () => {
    const { app, storiesService, token } = await buildApp();
    storiesService.getViews.mockResolvedValue([{ id: 'sv-1', user: { id: 'user-2' } }] as any);

    const r = await request(app.getHttpServer())
      .get('/stories/story-1/views')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    await app.close();
  });
});

describe('DELETE /stories/:id', () => {
  it('returns 200 when deleted', async () => {
    const { app, storiesService, token } = await buildApp();
    storiesService.delete.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer())
      .delete('/stories/story-1')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    await app.close();
  });
});

describe('POST /stories/:id/react', () => {
  it('returns 201 when reaction added', async () => {
    const mockAddReaction = jest.fn().mockResolvedValue(undefined);
    const { app, token } = await buildApp({ addReaction: mockAddReaction });

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/react')
      .set('Authorization', `Bearer ${token}`)
      .send({ reaction: '❤️' });

    expect(r.status).toBe(201);
    expect(mockAddReaction).toHaveBeenCalled();
    await app.close();
  });
});

describe('POST /stories/:id/reply', () => {
  it('returns 201 when reply added', async () => {
    const mockAddReply = jest.fn().mockResolvedValue(undefined);
    const { app, token } = await buildApp({ addReply: mockAddReply });

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/reply')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Cool story!' });

    expect(r.status).toBe(201);
    expect(mockAddReply).toHaveBeenCalled();
    await app.close();
  });
});
