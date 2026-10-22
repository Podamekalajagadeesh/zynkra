import { ConfigService } from '@nestjs/config';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CsrfGuard, issueCsrfToken, CSRF_HEADER } from './csrf.guard';

const TOKEN = 'a'.repeat(64);

function makeConfig(env: Record<string, string> = {}) {
  return { get: (k: string, f?: string) => env[k] ?? f } as unknown as ConfigService;
}

function makeContext(req: any): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function makeRes() {
  return { cookie: jest.fn(), setHeader: jest.fn() } as any;
}

describe('issueCsrfToken', () => {
  it('mints a 64-hex-character token and stores it on the session', () => {
    const session: Record<string, any> = {};
    const res = makeRes();
    const token = issueCsrfToken(session, res, {
      cookieName: 'zynkra.csrf',
      secure: false,
      maxAgeMs: 1000,
    });
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(session.csrfToken).toBe(token);
  });

  it('is stable across calls for the same session', () => {
    const session: Record<string, any> = {};
    const opts = { cookieName: 'zynkra.csrf', secure: false, maxAgeMs: 1000 };
    const first = issueCsrfToken(session, makeRes(), opts);
    const second = issueCsrfToken(session, makeRes(), opts);
    expect(second).toBe(first);
  });

  it('mirrors the token to a JS-readable cookie and the response header', () => {
    const session: Record<string, any> = {};
    const res = makeRes();
    const token = issueCsrfToken(session, res, {
      cookieName: 'zynkra.csrf',
      secure: true,
      maxAgeMs: 1000,
    });
    expect(res.cookie).toHaveBeenCalledWith(
      'zynkra.csrf',
      token,
      expect.objectContaining({ httpOnly: false, secure: true, sameSite: 'lax' })
    );
    expect(res.setHeader).toHaveBeenCalledWith(CSRF_HEADER, token);
  });
});

describe('CsrfGuard', () => {
  describe('when disabled', () => {
    it('allows everything', () => {
      const guard = new CsrfGuard(makeConfig({ CSRF_PROTECTION_ENABLED: 'false' }));
      expect(
        guard.canActivate(makeContext({ method: 'POST', session: { csrfToken: TOKEN } }))
      ).toBe(true);
    });
  });

  describe('requests that cannot be forged cross-site', () => {
    it('allows bearer-token requests', () => {
      // A browser does not attach Authorization automatically, so there is
      // nothing for a cross-site page to ride on.
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({
        method: 'POST',
        headers: { authorization: 'Bearer abc' },
        session: { csrfToken: TOKEN },
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it.each(['GET', 'HEAD', 'OPTIONS'])('allows %s', (method) => {
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({ method, session: { csrfToken: TOKEN } });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows requests with no session at all', () => {
      const guard = new CsrfGuard(makeConfig());
      expect(guard.canActivate(makeContext({ method: 'POST' }))).toBe(true);
    });

    it('allows a session that was never issued a token', () => {
      // Nothing was ever handed to a client, so nothing can be guessed.
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({ method: 'POST', session: {} });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('session-authenticated unsafe requests', () => {
    it('rejects a missing token', () => {
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({ method: 'POST', headers: {}, session: { csrfToken: TOKEN } });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('rejects a wrong token', () => {
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({
        method: 'POST',
        headers: { [CSRF_HEADER]: 'b'.repeat(64) },
        session: { csrfToken: TOKEN },
      });
      expect(() => guard.canActivate(ctx)).toThrow(/Invalid CSRF token/);
    });

    it('accepts the correct token in the header', () => {
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({
        method: 'POST',
        headers: { [CSRF_HEADER]: TOKEN },
        session: { csrfToken: TOKEN },
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('falls back to the cookie when the header is absent', () => {
      // Parsed from the raw Cookie header: this server has no cookie-parser,
      // and express-session does not populate req.cookies either.
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({
        method: 'POST',
        headers: { cookie: `other=1; zynkra.csrf=${TOKEN}; another=2` },
        session: { csrfToken: TOKEN },
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('prefers the header when both are present and disagreeing', () => {
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({
        method: 'POST',
        headers: { [CSRF_HEADER]: TOKEN, cookie: `zynkra.csrf=${'b'.repeat(64)}` },
        session: { csrfToken: TOKEN },
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('ignores a cookie with a different name', () => {
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({
        method: 'POST',
        headers: { cookie: `session=abc; other=${TOKEN}` },
        session: { csrfToken: TOKEN },
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('handles a URL-encoded cookie value', () => {
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({
        method: 'POST',
        headers: { cookie: `zynkra.csrf=${encodeURIComponent(TOKEN)}` },
        session: { csrfToken: TOKEN },
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('tolerates malformed cookie segments', () => {
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({
        method: 'POST',
        headers: { cookie: `; ; broken; zynkra.csrf=${TOKEN}` },
        session: { csrfToken: TOKEN },
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('honours a custom cookie name', () => {
      const guard = new CsrfGuard(makeConfig({ CSRF_COOKIE_NAME: 'custom.csrf' }));
      const ctx = makeContext({
        method: 'POST',
        headers: { cookie: `custom.csrf=${TOKEN}` },
        session: { csrfToken: TOKEN },
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('rejects a prefix of the correct token', () => {
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({
        method: 'POST',
        headers: { [CSRF_HEADER]: TOKEN.slice(0, 32) },
        session: { csrfToken: TOKEN },
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('treats method case-insensitively', () => {
      const guard = new CsrfGuard(makeConfig());
      const ctx = makeContext({ method: 'post', headers: {}, session: { csrfToken: TOKEN } });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
