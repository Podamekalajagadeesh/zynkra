/**
 * Integration tests for post edit and delete endpoints.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { PostsController } from '../src/posts/posts.controller';
import { PostsService } from '../src/posts/posts.service';
import { LoginSession } from '../src/auth/entities/login-session.entity';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

function createModule(serviceOverrides: Record<string, jest.Mock> = {}) {
  const defaultService: Record<string, jest.Mock> = {
    create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(),
    update: jest.fn(), remove: jest.fn(), like: jest.fn(), unlike: jest.fn(),
    share: jest.fn(), repost: jest.fn(), undoRepost: jest.fn(),
    togglePin: jest.fn(), archive: jest.fn(), feature: jest.fn(),
  };

  return Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test-secret' })],
    controllers: [PostsController],
    providers: [
      { provide: PostsService, useValue: { ...defaultService, ...serviceOverrides } },
      { provide: ConfigService, useValue: { get: (key: string) => key === 'JWT_SECRET' ? 'test-secret' : undefined } },
      { provide: getRepositoryToken(LoginSession), useValue: { findOne: jest.fn().mockResolvedValue({ id: 's1', revokedAt: null }), update: jest.fn() } },
      JwtStrategy,
    ],
  }).compile();
}

async function buildApp(serviceOverrides: Record<string, jest.Mock> = {}) {
  const ref = await createModule(serviceOverrides);
  const app = ref.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
  const token = app.get(JwtService).sign({ sub: 'user-1', sid: 's1' });
  return { app, postsService: app.get(PostsService) as jest.Mocked<PostsService>, token };
}

describe('PATCH /posts/:id (update post)', () => {
  it('returns 200 with updated post', async () => {
    const { app, postsService, token } = await buildApp();
    postsService.update.mockResolvedValue({ id: 'post-1', content: 'Updated' } as any);

    const r = await request(app.getHttpServer())
      .patch('/posts/post-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated', profileId: 1 });

    expect(r.status).toBe(200);
    expect(r.body.content).toBe('Updated');
    expect(postsService.update).toHaveBeenCalled();
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).patch('/posts/post-1').send({ content: 'X' });
    expect(r.status).toBe(401);
    await app.close();
  });
});

describe('DELETE /posts/:id (delete post)', () => {
  it('returns 200 when deleted', async () => {
    const { app, postsService, token } = await buildApp();
    postsService.remove.mockResolvedValue({ message: 'Post deleted' } as any);

    const r = await request(app.getHttpServer())
      .delete('/posts/post-1')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(postsService.remove).toHaveBeenCalled();
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).delete('/posts/post-1');
    expect(r.status).toBe(401);
    await app.close();
  });
});
