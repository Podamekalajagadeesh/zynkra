/**
 * Integration tests for close friends endpoints.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
    createFollowRequest: jest.fn(), acceptFollowRequest: jest.fn(), denyFollowRequest: jest.fn(),
    findMutualFollows: jest.fn(),
    getCloseFriends: jest.fn(), updateCloseFriends: jest.fn(),
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

describe('GET /users/me/close-friends', () => {
  it('returns 200 with close friends list', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.getCloseFriends.mockResolvedValue([
      { id: 'friend-1', username: 'alice' },
    ] as any);

    const r = await request(app.getHttpServer()).get('/users/me/close-friends').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    expect(r.body[0].username).toBe('alice');
    await app.close();
  });

  it('returns 200 with empty array', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.getCloseFriends.mockResolvedValue([]);

    const r = await request(app.getHttpServer()).get('/users/me/close-friends').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(0);
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).get('/users/me/close-friends');
    expect(r.status).toBe(401);
    await app.close();
  });
});

describe('PUT /users/me/close-friends', () => {
  it('returns 200 when updated', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.updateCloseFriends.mockResolvedValue({ closeFriends: [{ id: 'friend-1' }] } as any);

    const r = await request(app.getHttpServer())
      .put('/users/me/close-friends')
      .set('Authorization', `Bearer ${token}`)
      .send({ closeFriendIds: ['friend-1'] });

    expect(r.status).toBe(200);
    expect(usersService.updateCloseFriends).toHaveBeenCalledWith('user-1', ['friend-1']);
    await app.close();
  });

  it('returns 200 with empty list to remove all', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.updateCloseFriends.mockResolvedValue({ closeFriends: [] } as any);

    const r = await request(app.getHttpServer())
      .put('/users/me/close-friends')
      .set('Authorization', `Bearer ${token}`)
      .send({ closeFriendIds: [] });

    expect(r.status).toBe(200);
    expect(usersService.updateCloseFriends).toHaveBeenCalledWith('user-1', []);
    await app.close();
  });
});
