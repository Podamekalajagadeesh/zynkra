import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { ExecutionContext } from '@nestjs/common';
import { GqlAuthGuard } from './gql-jwt-auth.guard';

const AUDIENCE = 'zynkra-api';

function gqlContext(req: any) {
  return { getContext: () => ({ req }), getType: () => 'graphql' } as unknown as ExecutionContext;
}

const liveSession = { id: 'sess-1', revokedAt: null, user: { id: 'u1', email: 'a@b.c', role: 'user' } };

describe('GqlAuthGuard', () => {
  let jwtService: { verify: jest.Mock };
  let sessionsRepo: { findOne: jest.Mock };
  let guard: GqlAuthGuard;

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    sessionsRepo = { findOne: jest.fn().mockResolvedValue(liveSession) };
    guard = new GqlAuthGuard(
      jwtService as unknown as JwtService,
      { get: (k: string, f?: string) => (k === 'JWT_AUDIENCE' ? AUDIENCE : f) } as unknown as ConfigService,
      sessionsRepo as unknown as Repository<any>,
    );
  });

  const payload = (over: Record<string, unknown> = {}) => ({
    sub: 'u1',
    sid: 'sess-1',
    typ: 'access',
    aud: AUDIENCE,
    email: 'a@b.c',
    ...over,
  });

  it('rejects an unauthenticated query (regression: /graphql had no guard at all)', async () => {
    await expect(guard.canActivate(gqlContext({ headers: {} }))).rejects.toThrow(/bearer token/i);
  });

  it('accepts a valid bearer token and populates the REST-shaped principal', async () => {
    jwtService.verify.mockReturnValue(payload());
    const req: any = { headers: { authorization: 'Bearer jwt' } };
    await expect(guard.canActivate(gqlContext(req))).resolves.toBe(true);
    expect(req.user).toMatchObject({ userId: 'u1', id: 'u1', role: 'user', sessionId: 'sess-1' });
  });

  it('rejects an invalid signature', async () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('bad signature');
    });
    await expect(guard.canActivate(gqlContext({ headers: { authorization: 'Bearer jwt' } }))).rejects.toThrow(
      /Invalid or expired token/i,
    );
  });

  it('rejects a token with no sid', async () => {
    jwtService.verify.mockReturnValue(payload({ sid: undefined }));
    await expect(guard.canActivate(gqlContext({ headers: { authorization: 'Bearer jwt' } }))).rejects.toThrow(
      /Invalid or expired token/i,
    );
  });

  it('rejects a refresh token', async () => {
    jwtService.verify.mockReturnValue(payload({ typ: 'refresh' }));
    await expect(guard.canActivate(gqlContext({ headers: { authorization: 'Bearer jwt' } }))).rejects.toThrow(
      /Invalid or expired token/i,
    );
  });

  it('rejects a revoked session', async () => {
    sessionsRepo.findOne.mockResolvedValue({ ...liveSession, revokedAt: new Date() });
    await expect(guard.canActivate(gqlContext({ headers: { authorization: 'Bearer jwt' } }))).rejects.toThrow(
      /Session is missing or expired/i,
    );
  });

  it('rejects a banned user', async () => {
    sessionsRepo.findOne.mockResolvedValue({ ...liveSession, user: { ...liveSession.user, banned: true } });
    await expect(guard.canActivate(gqlContext({ headers: { authorization: 'Bearer jwt' } }))).rejects.toThrow(
      /Account is inactive/i,
    );
  });

  it('scopes the session lookup to the token subject', async () => {
    jwtService.verify.mockReturnValue(payload());
    await guard.canActivate(gqlContext({ headers: { authorization: 'Bearer jwt' } }));
    expect(sessionsRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'sess-1', user: { id: 'u1' } },
      relations: ['user'],
    });
  });

  it('short-circuits when the request is already authenticated', async () => {
    const req = { headers: {}, user: { userId: 'already-me' } };
    await expect(guard.canActivate(gqlContext(req))).resolves.toBe(true);
    expect(jwtService.verify).not.toHaveBeenCalled();
  });
});
