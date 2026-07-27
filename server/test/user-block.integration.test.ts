/**
 * Integration tests for block/unblock endpoints.
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
  };
  const serviceValue = { ...defaultService, ...overrides };

  return Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test-secret' })],
    controllers: [UsersController],
    providers: [
      { provide: UsersService, useValue: serviceValue },
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

describe('POST /users/:id/block', () => {
  it('returns 204 on block', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.block.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer()).post('/users/target-id/block').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(204);
    expect(usersService.block).toHaveBeenCalledWith('user-1', 'target-id');
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).post('/users/target-id/block');
    expect(r.status).toBe(401);
    await app.close();
  });

  it('returns 400 when trying to block yourself', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.block.mockRejectedValue(new BadRequestException('Cannot block yourself'));

    const r = await request(app.getHttpServer()).post('/users/user-1/block').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(400);
    await app.close();
  });

  it('returns 400 when already blocked', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.block.mockRejectedValue(new BadRequestException('User already blocked'));

    const r = await request(app.getHttpServer()).post('/users/target-id/block').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(400);
    await app.close();
  });
});

describe('DELETE /users/:id/block (unblock)', () => {
  it('returns 204 on unblock', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.unblock.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer()).delete('/users/target-id/block').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(204);
    expect(usersService.unblock).toHaveBeenCalledWith('user-1', 'target-id');
    await app.close();
  });

  it('returns 400 when user is not blocked', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.unblock.mockRejectedValue(new BadRequestException('User is not blocked'));

    const r = await request(app.getHttpServer()).delete('/users/target-id/block').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(400);
    await app.close();
  });
});

describe('GET /users/blocked', () => {
  it('returns 200 with blocked users list', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.getBlockedUsers.mockResolvedValue([
      { id: 'user-2', username: 'blocked_user' },
    ] as any);

    const r = await request(app.getHttpServer()).get('/users/blocked').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    expect(r.body[0].username).toBe('blocked_user');
    await app.close();
  });

  it('returns 200 with empty array when no blocked users', async () => {
    const { app, usersService, token } = await buildApp();
    usersService.getBlockedUsers.mockResolvedValue([]);

    const r = await request(app.getHttpServer()).get('/users/blocked').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(0);
    await app.close();
  });
});
