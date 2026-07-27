/**
 * Integration tests for mutual follows endpoint.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
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

describe('GET /users/:id/mutual', () => {
  it('returns 200 with mutual follows', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.findMutualFollows.mockResolvedValue([
      { id: 'mutual-1', username: 'alice' },
    ] as any);

    const r = await request(app.getHttpServer()).get('/users/user-2/mutual').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    expect(r.body[0].username).toBe('alice');
    await app.close();
  });

  it('returns 200 with empty array when no mutuals', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.findMutualFollows.mockResolvedValue([]);

    const r = await request(app.getHttpServer()).get('/users/user-2/mutual').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(0);
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).get('/users/user-2/mutual');
    expect(r.status).toBe(401);
    await app.close();
  });

  it('returns 404 when user not found', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.findMutualFollows.mockRejectedValue(new NotFoundException('User not found.'));

    const r = await request(app.getHttpServer()).get('/users/missing/mutual').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(404);
    await app.close();
  });
});
