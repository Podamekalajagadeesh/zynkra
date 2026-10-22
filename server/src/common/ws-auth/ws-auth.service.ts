import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { LoginSession } from '../../auth/entities/login-session.entity';

/** Shape stored on `socket.data` after a successful handshake authentication. */
export interface WsPrincipal {
  userId: string;
  email: string | null;
  role: string | null;
  sessionId: string;
}

/**
 * Authentication for Socket.IO handshakes.
 *
 * Gateways used to read `client.handshake.query.userId` and trust it, which let
 * any client claim any identity. This verifies the same bearer JWT the REST API
 * uses and — importantly — confirms the `LoginSession` is still live, so
 * `POST /auth/signout` and session revocation also close open sockets' identity.
 */
@Injectable()
export class WsAuthService {
  private readonly logger = new Logger(WsAuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(LoginSession)
    private readonly loginSessionsRepository: Repository<LoginSession>
  ) {}

  /**
   * Verifies the handshake and populates `socket.data.principal`.
   *
   * @returns true when authenticated. On false the socket has already been
   * disconnected, so callers should simply `return` from `handleConnection`.
   */
  async authenticate(client: Socket): Promise<boolean> {
    const principal = await this.resolvePrincipal(client);
    if (!principal) {
      this.logger.debug(
        `Rejecting unauthenticated socket ${client.id} (namespace: ${client.nsp?.name ?? 'default'})`
      );
      client.disconnect(true);
      return false;
    }
    client.data.principal = principal;
    // Mirrors the property name several gateways already read.
    client.data.userId = principal.userId;
    return true;
  }

  /** Same verification without mutating or disconnecting the socket. */
  async resolvePrincipal(client: Socket): Promise<WsPrincipal | null> {
    const token = this.extractToken(client);
    if (!token) {
      return null;
    }

    const audience = this.configService.get<string>('JWT_AUDIENCE', 'zynkra-api');

    let sub: string;
    let sid: string;
    let email: string | null = null;
    try {
      const payload = this.jwtService.verify<{
        sub?: unknown;
        sid?: unknown;
        typ?: unknown;
        aud?: unknown;
        email?: unknown;
      }>(token, { audience });

      if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
        return null;
      }
      // Refresh tokens and the 10-minute 2FA token must not open a socket.
      if (payload.typ !== undefined && payload.typ !== 'access') {
        return null;
      }
      const tokenAudiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (payload.aud !== undefined && !tokenAudiences.includes(audience)) {
        return null;
      }

      sub = payload.sub;
      sid = payload.sid;
      email = typeof payload.email === 'string' ? payload.email : null;
    } catch {
      return null;
    }

    // The session must still exist and be unrevoked — a signed-out user must
    // not keep a live socket identity.
    const session = await this.loginSessionsRepository.findOne({
      where: { id: sid, user: { id: sub } },
      relations: ['user'],
    });
    if (!session || session.revokedAt) {
      return null;
    }
    if (!session.user || session.user.status === 'deactivated' || session.user.banned) {
      return null;
    }

    return {
      userId: sub,
      email: email ?? session.user.email ?? null,
      role: session.user.role ?? null,
      sessionId: sid,
    };
  }

  /**
   * Accepts the token from `auth.token` (socket.io client convention) or an
   * `Authorization: Bearer` header. `query.token` is accepted as a last resort
   * for clients that cannot set headers during the HTTP upgrade, but note that
   * query strings land in access logs.
   */
  private extractToken(client: Socket): string | null {
    const authToken = client.handshake?.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const header = client.handshake?.headers?.authorization;
    if (typeof header === 'string' && header.length > 0) {
      return header.replace(/^Bearer\s+/i, '');
    }

    const queryToken = client.handshake?.query?.token;
    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return queryToken.replace(/^Bearer\s+/i, '');
    }

    return null;
  }
}
