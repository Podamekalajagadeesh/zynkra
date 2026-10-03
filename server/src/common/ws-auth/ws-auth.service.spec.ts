import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { WsAuthService } from './ws-auth.service';

const AUDIENCE = 'zynkra-api';

function makeSocket(overrides: { auth?: any; headers?: any; query?: any } = {}): Socket {
  return {
    id: 'socket-1',
    handshake: {
      auth: overrides.auth,
      headers: overrides.headers ?? {},
      query: overrides.query ?? {},
    },
    data: {},
    disconnect: jest.fn(),
    nsp: { name: '/' },
  } as unknown as Socket;
}

describe('WsAuthService', () => {
  const liveSession = { id: 'sess-1', revokedAt: null, user: { id: 'u1', email: 'a@b.c', role: 'user' } };

  let jwtService: { verify: jest.Mock };
  let sessionsRepo: { findOne: jest.Mock };
  let service: WsAuthService;

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    sessionsRepo = { findOne: jest.fn().mockResolvedValue(liveSession) };
    service = new WsAuthService(
      jwtService as unknown as JwtService,
      { get: (key: string, fallback?: string) => (key === 'JWT_AUDIENCE' ? AUDIENCE : fallback) } as unknown as ConfigService,
      sessionsRepo as unknown as Repository<any>,
    );
  });

  function validPayload(overrides: Record<string, unknown> = {}) {
    return {
      sub: 'u1',
      sid: 'sess-1',
      typ: 'access',
      aud: AUDIENCE,
      email: 'a@b.c',
      ...overrides,
    };
  }

  describe('token extraction', () => {
    it('accepts a token from handshake.auth', async () => {
      jwtService.verify.mockReturnValue(validPayload());
      const socket = makeSocket({ auth: { token: 'jwt' } });
      await expect(service.authenticate(socket)).resolves.toBe(true);
      expect(socket.data.userId).toBe('u1');
    });

    it('strips a Bearer prefix', async () => {
      jwtService.verify.mockReturnValue(validPayload());
      const socket = makeSocket({ headers: { authorization: 'Bearer jwt' } });
      await expect(service.authenticate(socket)).resolves.toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('jwt', { audience: AUDIENCE });
    });

    it('rejects a socket with no token and disconnects it', async () => {
      const socket = makeSocket();
      const disconnect = socket.disconnect as unknown as jest.Mock;
      await expect(service.authenticate(socket)).resolves.toBe(false);
      expect(disconnect).toHaveBeenCalledWith(true);
      expect(socket.data.userId).toBeUndefined();
    });
  });

  describe('rejects forged or invalid claims', () => {
    it('rejects when the token cannot be verified', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });
      await expect(service.authenticate(makeSocket({ auth: { token: 'forged' } }))).resolves.toBe(false);
    });

    it('rejects a token with no sub', async () => {
      jwtService.verify.mockReturnValue(validPayload({ sub: undefined }));
      await expect(service.authenticate(makeSocket({ auth: { token: 'jwt' } }))).resolves.toBe(false);
    });

    it('rejects a token with no sid', async () => {
      // This is the SIWE bug: a token signed without `sid` is unusable, and
      // without this check the socket would open with no revocable session.
      jwtService.verify.mockReturnValue(validPayload({ sid: undefined }));
      await expect(service.authenticate(makeSocket({ auth: { token: 'jwt' } }))).resolves.toBe(false);
    });

    it('rejects a refresh token', async () => {
      jwtService.verify.mockReturnValue(validPayload({ typ: 'refresh' }));
      await expect(service.authenticate(makeSocket({ auth: { token: 'jwt' } }))).resolves.toBe(false);
    });

    it('rejects a token for a different audience', async () => {
      jwtService.verify.mockReturnValue(validPayload({ aud: 'some-other-api' }));
      await expect(service.authenticate(makeSocket({ auth: { token: 'jwt' } }))).resolves.toBe(false);
    });
  });

  describe('session liveness', () => {
    it('rejects a revoked session (sign-out closes socket identity)', async () => {
      sessionsRepo.findOne.mockResolvedValue({ ...liveSession, revokedAt: new Date() });
      await expect(service.authenticate(makeSocket({ auth: { token: 'jwt' } }))).resolves.toBe(false);
    });

    it('rejects when the session row is gone', async () => {
      sessionsRepo.findOne.mockResolvedValue(null);
      await expect(service.authenticate(makeSocket({ auth: { token: 'jwt' } }))).resolves.toBe(false);
    });

    it('rejects a banned user', async () => {
      sessionsRepo.findOne.mockResolvedValue({
        ...liveSession,
        user: { ...liveSession.user, banned: true },
      });
      await expect(service.authenticate(makeSocket({ auth: { token: 'jwt' } }))).resolves.toBe(false);
    });

    it('rejects a deactivated user', async () => {
      sessionsRepo.findOne.mockResolvedValue({
        ...liveSession,
        user: { ...liveSession.user, status: 'deactivated' },
      });
      await expect(service.authenticate(makeSocket({ auth: { token: 'jwt' } }))).resolves.toBe(false);
    });

    it('scopes the session lookup to the token subject', async () => {
      await service.authenticate(makeSocket({ auth: { token: 'jwt' } }));
      expect(sessionsRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'sess-1', user: { id: 'u1' } },
        relations: ['user'],
      });
    });
  });

  describe('principal', () => {
    it('exposes role so gateways can make authorization decisions', async () => {
      sessionsRepo.findOne.mockResolvedValue({
        ...liveSession,
        user: { ...liveSession.user, role: 'admin' },
      });
      const socket = makeSocket({ auth: { token: 'jwt' } });
      await service.authenticate(socket);
      expect(socket.data.principal).toMatchObject({ userId: 'u1', role: 'admin', sessionId: 'sess-1' });
    });
  });
});
