/**
 * Integration tests for follower/following list endpoints.
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

function createMockUserService() {
  return {
    follow: jest.fn(),
    unfollow: jest.fn(),
    getFollowers: jest.fn(),
    findOneById: jest.fn(),
    updateProfile: jest.fn(),
    update: jest.fn(),
    updateAvatar: jest.fn(),
    findByUsername: jest.fn(),
    findOneWithPosts: jest.fn(),
    search: jest.fn(),
    updatePrivacy: jest.fn(),
    removeFollower: jest.fn(),
  };
}

function createApp(userServiceOverrides = {}) {
  const mockService = { ...createMockUserService(), ...userServiceOverrides };

  return Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test-secret' })],
    controllers: [UsersController],
    providers: [
      { provide: UsersService, useValue: mockService },
      { provide: PagesService, useValue: {} },
      { provide: ConfigService, useValue: { get: (key: string) => key === 'JWT_SECRET' ? 'test-secret' : undefined } },
      { provide: getRepositoryToken(LoginSession), useValue: { findOne: jest.fn().mockResolvedValue({ id: 's1', revokedAt: null }), update: jest.fn() } },
      JwtStrategy,
    ],
  }).compile();
}

async function buildApp(serviceOverrides = {}) {
  const ref = await createApp(serviceOverrides);
  const app = ref.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
  const token = app.get(JwtService).sign({ sub: 'user-1', sid: 's1' });
  return { app, usersService: app.get(UsersService) as jest.Mocked<UsersService>, token };
}

describe('GET /users/me/followers', () => {
  it('returns 200 with followers list', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.getFollowers.mockResolvedValue([
      { id: 'follower-1', username: 'alice', displayName: 'Alice' },
      { id: 'follower-2', username: 'bob', displayName: 'Bob' },
    ] as any);

    const r = await request(app.getHttpServer()).get('/users/me/followers').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(2);
    expect(r.body[0].username).toBe('alice');
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).get('/users/me/followers');
    expect(r.status).toBe(401);
    await app.close();
  });

  it('returns 404 when user not found', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.getFollowers.mockRejectedValue(new NotFoundException('User not found'));

    const r = await request(app.getHttpServer()).get('/users/me/followers').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(404);
    await app.close();
  });
});

describe('DELETE /users/followers/:id (remove follower)', () => {
  it('returns 204 on successful removal', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.unfollow.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer()).delete('/users/followers/follower-1').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(204);
    expect(usersService.unfollow).toHaveBeenCalledWith('follower-1', 'user-1');
    await app.close();
  });
});
