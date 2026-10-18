import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TOKEN_BYTES = 32;

export const CSRF_HEADER = 'x-csrf-token';

/**
 * Read a cookie from the raw `Cookie` header.
 *
 * `req.cookies` is populated by `cookie-parser`, which this server does not
 * install — and `express-session` does not do it either. Rather than add a
 * dependency for one value, parse the header here. (The session cookie itself
 * is consumed by express-session, which does its own parsing.)
 */
function readCookie(request: Request, name: string): string | null {
  const header = request.headers?.cookie;
  if (typeof header !== 'string' || header.length === 0) {
    return null;
  }
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      return part.slice(eq + 1).trim();
    }
  }
  return null;
}

/**
 * Double-submit CSRF protection for the session-authenticated routes.
 *
 * Which routes need this: those whose *only* credential is the session cookie.
 * The session is used for the WebAuthn challenge, the SIWE nonce, and the
 * wallet-link nonce — so without a token check, a cross-site page could drive
 * those flows in a victim's browser. Bearer-token routes are unaffected: the
 * `Authorization` header is not attached automatically by a browser, so there is
 * nothing for a cross-site page to ride on.
 *
 * Pattern: a random token is stored in the session and *also* returned to the
 * client in a readable cookie and a response header. The client echoes it in the
 * `X-CSRF-Token` header. A cross-site attacker can cause the browser to send the
 * cookie but cannot read the cookie to copy it into a header.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly enabled: boolean;
  private readonly cookieName: string;

  constructor(configService: ConfigService) {
    this.enabled = configService.get<string>('CSRF_PROTECTION_ENABLED', 'true') !== 'false';
    this.cookieName = configService.get<string>('CSRF_COOKIE_NAME', 'zynkra.csrf');
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.enabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // A bearer token is not attached automatically by a browser, so a
    // cross-site page cannot supply it. These routes are not CSRF-able.
    const auth = request.headers?.authorization;
    if (typeof auth === 'string' && /^Bearer\s+\S+/i.test(auth)) {
      return true;
    }

    if (SAFE_METHODS.has(request.method?.toUpperCase() ?? 'GET')) {
      return true;
    }

    const session = (request as any).session as Record<string, any> | undefined;
    if (!session) {
      return true;
    }

    const expected = typeof session.csrfToken === 'string' ? session.csrfToken : null;
    if (!expected) {
      // No token was ever issued for this session, so there is nothing a
      // cross-site request could have guessed. Nothing to check.
      return true;
    }

    const provided = this.readToken(request);
    if (!provided) {
      throw new ForbiddenException(
        `Missing CSRF token. Send it in the ${CSRF_HEADER} header (see GET /auth/csrf-token).`,
      );
    }

    if (!this.tokensMatch(expected, provided)) {
      throw new ForbiddenException('Invalid CSRF token.');
    }

    return true;
  }

  private readToken(request: Request): string | null {
    const headerValue = request.headers?.[CSRF_HEADER];
    if (typeof headerValue === 'string' && headerValue.length > 0) {
      return headerValue;
    }
    const fromCookie = readCookie(request, this.cookieName);
    if (fromCookie) {
      return fromCookie;
    }
    return null;
  }

  /**
   * Constant-time comparison. The token is a random hex string, so a length
   * mismatch is not a secret, but the timings should not depend on the prefix
   * either.
   */
  private tokensMatch(expected: string, provided: string): boolean {
    const a = Buffer.from(createHash('sha256').update(expected).digest('hex'), 'utf8');
    const b = Buffer.from(createHash('sha256').update(provided).digest('hex'), 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  }
}

/**
 * Issue a CSRF token for the current session and mirror it to a readable cookie.
 * Call this from a `GET` route; the client then echoes the value in the header.
 */
export function issueCsrfToken(
  session: Record<string, any>,
  res: {
    cookie?: (name: string, value: string, options: Record<string, unknown>) => unknown;
    setHeader?: (name: string, value: string) => unknown;
  },
  options: { cookieName: string; secure: boolean; maxAgeMs: number },
): string {
  let token = session.csrfToken;
  if (typeof token !== 'string' || token.length === 0) {
    token = randomBytes(TOKEN_BYTES).toString('hex');
    session.csrfToken = token;
  }

  // Readable by JS on purpose — the client has to copy it into a header. That is
  // safe: a cross-site page cannot read another origin's cookies.
  res.cookie?.(options.cookieName, token, {
    httpOnly: false,
    secure: options.secure,
    sameSite: 'lax',
    maxAge: options.maxAgeMs,
    path: '/',
  });
  res.setHeader?.(CSRF_HEADER, token);

  return token;
}
