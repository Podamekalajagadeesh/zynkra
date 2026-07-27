/**
 * Integration tests for articles endpoints.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { ArticlesController } from '../src/articles/articles.controller';
import { ArticlesService } from '../src/articles/articles.service';
import { LoginSession } from '../src/auth/entities/login-session.entity';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

function createModule(serviceOverrides: Record<string, jest.Mock> = {}) {
  const defaultService: Record<string, jest.Mock> = {
    create: jest.fn(), update: jest.fn(), publish: jest.fn(), archive: jest.fn(),
    deleteArticle: jest.fn(), getFeed: jest.fn(), getUserDrafts: jest.fn(),
    findBySlug: jest.fn(), findById: jest.fn(),
  };

  return Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test-secret' })],
    controllers: [ArticlesController],
    providers: [
      { provide: ArticlesService, useValue: { ...defaultService, ...serviceOverrides } },
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
  return { app, service: app.get(ArticlesService) as jest.Mocked<ArticlesService>, token };
}

describe('POST /articles (create)', () => {
  it('returns 201 with created article', async () => {
    const { app, service, token } = await buildApp();
    service.create.mockResolvedValue({ id: 'art-1', title: 'My Article' } as any);

    const r = await request(app.getHttpServer())
      .post('/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Article', content: 'Content here' });

    expect(r.status).toBe(201);
    expect(r.body.title).toBe('My Article');
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).post('/articles').send({ title: 'X', content: 'Y' });
    expect(r.status).toBe(401);
    await app.close();
  });
});

describe('GET /articles/feed', () => {
  it('returns 200 with articles feed', async () => {
    const { app, service } = await buildApp();
    service.getFeed.mockResolvedValue({
      articles: [{ id: 'art-1', title: 'Article' }],
      total: 1, page: 1, limit: 20,
    } as any);

    const r = await request(app.getHttpServer()).get('/articles/feed');
    expect(r.status).toBe(200);
    expect(r.body.articles).toHaveLength(1);
    await app.close();
  });
});

describe('GET /articles/:slug', () => {
  it('returns 200 with article by slug', async () => {
    const { app, service } = await buildApp();
    service.findBySlug.mockResolvedValue({ id: 'art-1', title: 'Article' } as any);

    const r = await request(app.getHttpServer()).get('/articles/my-article');
    expect(r.status).toBe(200);
    expect(r.body.title).toBe('Article');
    await app.close();
  });

  it('returns 404 when not found', async () => {
    const { app, service } = await buildApp();
    service.findBySlug.mockRejectedValue(new NotFoundException('Article not found'));

    const r = await request(app.getHttpServer()).get('/articles/missing');
    expect(r.status).toBe(404);
    await app.close();
  });
});

describe('POST /articles/:id/publish', () => {
  it('returns 200 when published', async () => {
    const { app, service, token } = await buildApp();
    service.publish.mockResolvedValue({ id: 'art-1', status: 'published' } as any);

    const r = await request(app.getHttpServer())
      .post('/articles/art-1/publish')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(service.publish).toHaveBeenCalled();
    await app.close();
  });
});

describe('DELETE /articles/:id', () => {
  it('returns 204 when deleted', async () => {
    const { app, service, token } = await buildApp();
    service.deleteArticle.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer())
      .delete('/articles/art-1')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(204);
    expect(service.deleteArticle).toHaveBeenCalled();
    await app.close();
  });
});
