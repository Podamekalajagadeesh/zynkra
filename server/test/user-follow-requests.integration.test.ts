/**
 * Integration tests for follow request endpoints.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException, BadRequestException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { PagesService } from '../src/pages/pages.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { LoginSession } from '../src/auth/entities/login-session.entity';

function createModule(overrides: Record<string, jest.Mock> = {}) {
  const defaultService: Record<string, jest.Mock> = {
    follow: jest.fn(), unfollow: jest.fn(), getFollowers: jest.fn(),
    block: jest.fn(), unblock: jest.fn(), getBlockedUsers: jest.fn(),
    findOneById: jest.fn(), updateProfile: jest.fn(), update: jest.fn(),
    updateAvatar: jest.fn(), findByUsername: jest.fn(), findOneWithPosts: jest.fn(),
    search: jest.fn(), updatePrivacy: jest.fn(),
    createFollowRequest: jest.fn(), acceptFollowRequest: jest.fn(),
    denyFollowRequest: jest.fn(), findMutualFollows: jest.fn(),
  };

  return Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test-secret' })],
    controllers: [UsersController],
    providers: [
      { provide: UsersService, useValue: { ...defaultService, ...overrides } },
      { provide: PagesService, useValue: {} },
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
  return { app, usersService: app.get(UsersService) as jest.Mocked<UsersService>, token };
}

describe('POST /users/:id/follow-request', () => {
  it('returns 204 when follow request created', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.createFollowRequest.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer()).post('/users/private-user/follow-request').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(204);
    expect(usersService.createFollowRequest).toHaveBeenCalledWith('user-1', 'private-user');
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).post('/users/target/follow-request');
    expect(r.status).toBe(401);
    await app.close();
  });

  it('returns 404 when target user not found', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.createFollowRequest.mockRejectedValue(new NotFoundException('User not found'));

    const r = await request(app.getHttpServer()).post('/users/missing/follow-request').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(404);
    await app.close();
  });
});

describe('POST /users/follow-requests/:id/accept', () => {
  it('returns 204 when accepted', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.acceptFollowRequest.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer()).post('/users/follow-requests/req-1/accept').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(204);
    expect(usersService.acceptFollowRequest).toHaveBeenCalledWith('user-1', 'req-1');
    await app.close();
  });

  it('returns 404 when request not found', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.acceptFollowRequest.mockRejectedValue(new NotFoundException('Follow request not found'));

    const r = await request(app.getHttpServer()).post('/users/follow-requests/missing/accept').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(404);
    await app.close();
  });
});

describe('POST /users/follow-requests/:id/deny', () => {
  it('returns 204 when denied', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.denyFollowRequest.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer()).post('/users/follow-requests/req-1/deny').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(204);
    expect(usersService.denyFollowRequest).toHaveBeenCalledWith('user-1', 'req-1');
    await app.close();
  });

  it('returns 404 when request not found', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.denyFollowRequest.mockRejectedValue(new NotFoundException('Follow request not found'));

    const r = await request(app.getHttpServer()).post('/users/follow-requests/missing/deny').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(404);
    await app.close();
  });
});
