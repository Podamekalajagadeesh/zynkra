/**
 * Integration tests for user profile endpoints.
 * Tests the HTTP layer through supertest with mocked dependencies.
 */

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException, ConflictException } from '@nestjs/common';
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

function makeMockUser(overrides = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    bio: 'A test user',
    avatar: '/uploads/avatars/test.jpg',
    following: [],
    followers: [],
    ...overrides,
  };
}

function createTestingModule() {
  return Test.createTestingModule({
    imports: [
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } }),
    ],
    controllers: [UsersController],
    providers: [
      {
        provide: UsersService,
        useValue: {
          findOneById: jest.fn(),
          updateProfile: jest.fn(),
          update: jest.fn(),
          updateAvatar: jest.fn(),
          findByUsername: jest.fn(),
          findOneWithPosts: jest.fn(),
          search: jest.fn(),
          updatePrivacy: jest.fn(),
        },
      },
      { provide: PagesService, useValue: {} },
      {
        provide: ConfigService,
        useValue: { get: (key: string) => key === 'JWT_SECRET' ? 'test-secret' : undefined },
      },
      {
        provide: getRepositoryToken(LoginSession),
        useValue: { findOne: jest.fn().mockResolvedValue({ id: 's1', revokedAt: null }), update: jest.fn(), find: jest.fn(), save: jest.fn() },
      },
      JwtStrategy,
    ],
  }).compile();
}

async function setupApp() {
  const moduleRef = await createTestingModule();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  const token = app.get(JwtService).sign({ sub: makeMockUser().id, sid: 's1' });
  return { app, usersService: app.get(UsersService) as jest.Mocked<UsersService>, token };
}

describe('GET /users/me', () => {
  it('returns 200 with profile for valid JWT', async () => {
    const { app, usersService, token } = await setupApp();
    usersService.findOneById.mockResolvedValue(makeMockUser() as any);
    const response = await request(app.getHttpServer()).get('/users/me').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser');
    await app.close();
  });

  it('returns 401 without auth token', async () => {
    const { app } = await setupApp();
    const response = await request(app.getHttpServer()).get('/users/me');
    expect(response.status).toBe(401);
    await app.close();
  });
});

describe('PATCH /users/profile', () => {
  it('returns 200 with updated profile', async () => {
    const { app, usersService, token } = await setupApp();
    usersService.updateProfile.mockResolvedValue(makeMockUser({ displayName: 'Updated' }) as any);
    const response = await request(app.getHttpServer()).patch('/users/profile').set('Authorization', `Bearer ${token}`).field('displayName', 'Updated');
    expect(response.status).toBe(200);
    await app.close();
  });

  it('returns 404 when user not found', async () => {
    const { app, usersService, token } = await setupApp();
    usersService.updateProfile.mockRejectedValue(new NotFoundException('User not found'));
    const response = await request(app.getHttpServer()).patch('/users/profile').set('Authorization', `Bearer ${token}`).field('displayName', 'Updated');
    expect(response.status).toBe(404);
    await app.close();
  });

  it('returns 409 when username is taken', async () => {
    const { app, usersService, token } = await setupApp();
    usersService.updateProfile.mockRejectedValue(new ConflictException('Username already exists'));
    const response = await request(app.getHttpServer()).patch('/users/profile').set('Authorization', `Bearer ${token}`).field('username', 'taken');
    expect(response.status).toBe(409);
    await app.close();
  });
});
