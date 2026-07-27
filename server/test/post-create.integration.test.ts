/**
 * Integration tests for post creation endpoints.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException, BadRequestException } from '@nestjs/common';
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

describe('POST /posts (create text post)', () => {
  it('returns 201 with created post', async () => {
    const { app, postsService, token } = await buildApp();
    postsService.create.mockResolvedValue({
      id: 'post-1', content: 'Hello world',
    } as any);

    const r = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello world', profileId: 1 });

    expect(r.status).toBe(201);
    expect(r.body.content).toBe('Hello world');
    expect(postsService.create).toHaveBeenCalled();
    await app.close();
  });

  it('returns 201 with created post containing media', async () => {
    const { app, postsService, token } = await buildApp();
    postsService.create.mockResolvedValue({
      id: 'post-2', content: 'With images',
    } as any);

    const r = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'With images',
        profileId: 1,
        media: [
          { url: 'https://cdn.example.com/img1.jpg', type: 'image', altText: 'Photo 1' },
          { url: 'https://cdn.example.com/img2.jpg', type: 'image', altText: 'Photo 2' },
        ],
      });

    expect(r.status).toBe(201);
    expect(postsService.create).toHaveBeenCalled();
    const callArgs = postsService.create.mock.calls[0][1];
    expect(callArgs.media).toHaveLength(2);
    expect(callArgs.media[0].type).toBe('image');
    expect(callArgs.media[0].altText).toBe('Photo 1');
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer())
      .post('/posts')
      .send({ content: 'Hello' });
    expect(r.status).toBe(401);
    await app.close();
  });

  it('returns 400 when content is missing', async () => {
    const { app, token } = await buildApp();
    const r = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ profileId: 1 });
    expect(r.status).toBe(400);
    await app.close();
  });

  it('returns 400 for encrypted post without encryptedContent', async () => {
    const { app, postsService, token } = await buildApp();
    postsService.create.mockRejectedValue(new BadRequestException('Encrypted posts require encryptedContent'));

    const r = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'secret', profileId: 1, isEncrypted: true });

    expect(r.status).toBe(400);
    await app.close();
  });
});

describe('GET /posts (list posts)', () => {
  it('returns 200 with posts list', async () => {
    const { app, postsService } = await buildApp();
    postsService.findAll.mockResolvedValue([{ id: 'post-1', content: 'Hello' }] as any);

    const r = await request(app.getHttpServer()).get('/posts');
    expect(r.status).toBe(200);
    await app.close();
  });
});

describe('GET /posts/:id (get post)', () => {
  it('returns 200 with post', async () => {
    const { app, postsService } = await buildApp();
    postsService.findOne.mockResolvedValue({ id: 'post-1', content: 'Hello' } as any);

    const r = await request(app.getHttpServer()).get('/posts/post-1');
    expect(r.status).toBe(200);
    expect(r.body.id).toBe('post-1');
    await app.close();
  });

  it('returns 404 when post not found', async () => {
    const { app, postsService } = await buildApp();
    postsService.findOne.mockRejectedValue(new NotFoundException('Post not found'));

    const r = await request(app.getHttpServer()).get('/posts/missing');
    expect(r.status).toBe(404);
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
});

describe('POST /posts/:id/like', () => {
  it('returns 201 when liked', async () => {
    const { app, postsService, token } = await buildApp();
    postsService.like.mockResolvedValue({ message: 'Liked' } as any);

    const r = await request(app.getHttpServer())
      .post('/posts/post-1/like')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(201);
    expect(postsService.like).toHaveBeenCalled();
    await app.close();
  });
});
