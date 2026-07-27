/**
 * Integration tests for follow/unfollow endpoints.
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

function createModule() {
  return Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test-secret' })],
    controllers: [UsersController],
    providers: [
      { provide: UsersService, useValue: { follow: jest.fn(), unfollow: jest.fn(), findOneById: jest.fn(), updateProfile: jest.fn(), update: jest.fn(), updateAvatar: jest.fn(), findByUsername: jest.fn(), findOneWithPosts: jest.fn(), search: jest.fn(), updatePrivacy: jest.fn(), getFollowing: jest.fn(), getPendingFollowRequests: jest.fn(), cancelFollowRequest: jest.fn(), getFollowers: jest.fn(), removeFollower: jest.fn() } },
      { provide: PagesService, useValue: {} },
      { provide: ConfigService, useValue: { get: (key: string) => key === 'JWT_SECRET' ? 'test-secret' : undefined } },
      { provide: getRepositoryToken(LoginSession), useValue: { findOne: jest.fn().mockResolvedValue({ id: 's1', revokedAt: null }), update: jest.fn() } },
      JwtStrategy,
    ],
  }).compile();
}

describe('POST /users/:id/follow', () => {
  let app: INestApplication; let usersService: jest.Mocked<UsersService>; let token: string;

  beforeAll(async () => {
    const ref = await createModule(); app = ref.createNestApplication(); app.useGlobalPipes(new ValidationPipe()); await app.init();
    usersService = app.get(UsersService) as jest.Mocked<UsersService>;
    token = app.get(JwtService).sign({ sub: 'user-1', sid: 's1' });
  });
  afterAll(async () => { if (app) await app.close(); });
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const r = await request(app.getHttpServer()).post('/users/target-id/follow');
    expect(r.status).toBe(401);
  });

  it('responds when followed', async () => {
    usersService.follow.mockResolvedValue(undefined);
    const r = await request(app.getHttpServer()).post('/users/target-id/follow').set('Authorization', `Bearer ${token}`);
    expect(usersService.follow).toHaveBeenCalledWith('user-1', 'target-id');
    expect(r.status).toBe(204);
  });
});

describe('DELETE /users/:id/follow', () => {
  let app: INestApplication; let usersService: jest.Mocked<UsersService>; let token: string;

  beforeAll(async () => {
    const ref = await createModule(); app = ref.createNestApplication(); app.useGlobalPipes(new ValidationPipe()); await app.init();
    usersService = app.get(UsersService) as jest.Mocked<UsersService>;
    token = app.get(JwtService).sign({ sub: 'user-1', sid: 's1' });
  });
  afterAll(async () => { if (app) await app.close(); });
  beforeEach(() => jest.clearAllMocks());

  it('responds when unfollowed', async () => {
    usersService.unfollow.mockResolvedValue(undefined);
    const r = await request(app.getHttpServer()).delete('/users/target-id/follow').set('Authorization', `Bearer ${token}`);
    expect(usersService.unfollow).toHaveBeenCalledWith('user-1', 'target-id');
    expect(r.status).toBe(204);
  });
});

describe('GET /users/me/following', () => {
  let app: INestApplication; let usersService: jest.Mocked<UsersService>; let token: string;

  beforeAll(async () => {
    const ref = await createModule(); app = ref.createNestApplication(); app.useGlobalPipes(new ValidationPipe()); await app.init();
    usersService = app.get(UsersService) as jest.Mocked<UsersService>;
    token = app.get(JwtService).sign({ sub: 'user-1', sid: 's1' });
  });
  afterAll(async () => { if (app) await app.close(); });
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const r = await request(app.getHttpServer()).get('/users/me/following');
    expect(r.status).toBe(401);
  });

  it('returns 200 with following list', async () => {
    usersService.getFollowing.mockResolvedValue([{ id: 'friend-1' } as any]);
    const r = await request(app.getHttpServer()).get('/users/me/following').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(usersService.getFollowing).toHaveBeenCalledWith('user-1');
  });
});

describe('GET /users/me/follow-requests/pending', () => {
  let app: INestApplication; let usersService: jest.Mocked<UsersService>; let token: string;

  beforeAll(async () => {
    const ref = await createModule(); app = ref.createNestApplication(); app.useGlobalPipes(new ValidationPipe()); await app.init();
    usersService = app.get(UsersService) as jest.Mocked<UsersService>;
    token = app.get(JwtService).sign({ sub: 'user-1', sid: 's1' });
  });
  afterAll(async () => { if (app) await app.close(); });
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const r = await request(app.getHttpServer()).get('/users/me/follow-requests/pending');
    expect(r.status).toBe(401);
  });

  it('returns 200 with pending requests', async () => {
    usersService.getPendingFollowRequests.mockResolvedValue([{ id: 'req-1', requester: { id: 'user-2' } } as any]);
    const r = await request(app.getHttpServer()).get('/users/me/follow-requests/pending').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(usersService.getPendingFollowRequests).toHaveBeenCalledWith('user-1');
  });
});

describe('DELETE /users/follow-requests/:id', () => {
  let app: INestApplication; let usersService: jest.Mocked<UsersService>; let token: string;

  beforeAll(async () => {
    const ref = await createModule(); app = ref.createNestApplication(); app.useGlobalPipes(new ValidationPipe()); await app.init();
    usersService = app.get(UsersService) as jest.Mocked<UsersService>;
    token = app.get(JwtService).sign({ sub: 'user-1', sid: 's1' });
  });
  afterAll(async () => { if (app) await app.close(); });
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const r = await request(app.getHttpServer()).delete('/users/follow-requests/req-1');
    expect(r.status).toBe(401);
  });

  it('returns 204 on successful cancel', async () => {
    usersService.cancelFollowRequest.mockResolvedValue(undefined);
    const r = await request(app.getHttpServer()).delete('/users/follow-requests/req-1').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(204);
    expect(usersService.cancelFollowRequest).toHaveBeenCalledWith('user-1', 'req-1');
  });

  it('returns 404 when request not found', async () => {
    usersService.cancelFollowRequest.mockRejectedValue(new NotFoundException('Follow request not found.'));
    const r = await request(app.getHttpServer()).delete('/users/follow-requests/req-1').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(404);
  });
});
