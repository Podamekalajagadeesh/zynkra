/**
 * Integration tests for polls endpoint.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { PollsController } from '../src/polls/polls.controller';
import { PollsService } from '../src/polls/polls.service';
import { LoginSession } from '../src/auth/entities/login-session.entity';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

function createModule(overrides: Record<string, jest.Mock> = {}) {
  return Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test-secret' })],
    controllers: [PollsController],
    providers: [
      { provide: PollsService, useValue: { vote: overrides.vote || jest.fn() } },
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
  return { app, pollsService: app.get(PollsService) as jest.Mocked<PollsService>, token };
}

describe('POST /polls/:pollOptionId/vote', () => {
  it('returns 200 when voted', async () => {
    const { app, pollsService, token } = await buildApp();
    pollsService.vote.mockResolvedValue({ id: 'poll-1', options: [{ id: 'opt-1', voteCount: 1 }] } as any);

    const r = await request(app.getHttpServer())
      .post('/polls/opt-1/vote')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(201);
    expect(pollsService.vote).toHaveBeenCalledWith('opt-1', 'user-1');
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).post('/polls/opt-1/vote');
    expect(r.status).toBe(401);
    await app.close();
  });

  it('returns 404 when poll option not found', async () => {
    const { app, pollsService, token } = await buildApp();
    pollsService.vote.mockRejectedValue(new NotFoundException('Poll option not found'));

    const r = await request(app.getHttpServer())
      .post('/polls/missing/vote')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(404);
    await app.close();
  });

  it('returns 401 when user already voted', async () => {
    const { app, pollsService, token } = await buildApp();
    pollsService.vote.mockRejectedValue(new UnauthorizedException('User has already voted'));

    const r = await request(app.getHttpServer())
      .post('/polls/opt-1/vote')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(401);
    await app.close();
  });

  it('returns 404 when poll not found', async () => {
    const { app, pollsService, token } = await buildApp();
    pollsService.vote.mockRejectedValue(new NotFoundException('Poll not found'));

    const r = await request(app.getHttpServer())
      .post('/polls/opt-1/vote')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(404);
    await app.close();
  });
});
