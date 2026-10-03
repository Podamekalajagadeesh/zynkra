import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginSession } from '../../auth/entities/login-session.entity';

export interface GqlPrincipal {
  userId: string;
  email: string | null;
  role: string | null;
}

/**
 * Authenticates GraphQL resolvers with the same bearer JWT + LoginSession the
 * REST API uses.
 *
 * `/graphql` was mounted with no guard at all, so its read queries were
 * reachable anonymously across the whole database — bypassing the visibility
 * filtering the REST controllers apply. This verifies the token and puts the
 * principal on `context.req.user` so resolvers can pass a viewer id through.
 */
@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(LoginSession)
    private readonly loginSessionsRepository: Repository<LoginSession>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context).getContext<{ req?: any }>();
    const request = gqlContext?.req;
    if (!request) {
      throw new UnauthorizedException('GraphQL context is missing the HTTP request.');
    }

    if (request.user?.userId) {
      return true;
    }

    const header: string | undefined = request.headers?.authorization;
    const raw =
      request.headers?.['x-access-token'] ??
      (typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : undefined);
    if (!raw) {
      throw new UnauthorizedException('A bearer token is required for this query.');
    }

    const audience = this.configService.get<string>('JWT_AUDIENCE', 'zynkra-api');
    let payload: { sub?: unknown; sid?: unknown; typ?: unknown; aud?: unknown; email?: unknown };
    try {
      payload = this.jwtService.verify(raw, { audience });
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
      throw new UnauthorizedException('Invalid or expired token.');
    }
    if (payload.typ !== undefined && payload.typ !== 'access') {
      throw new UnauthorizedException('Invalid or expired token.');
    }
    const tokenAudiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (payload.aud !== undefined && !tokenAudiences.includes(audience)) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    const session = await this.loginSessionsRepository.findOne({
      where: { id: payload.sid, user: { id: payload.sub } },
      relations: ['user'],
    });
    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session is missing or expired.');
    }
    if (!session.user || session.user.status === 'deactivated' || session.user.banned) {
      throw new UnauthorizedException('Account is inactive.');
    }

    const principal: GqlPrincipal = {
      userId: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : (session.user.email ?? null),
      role: session.user.role ?? null,
    };

    // Match the REST principal shape so resolvers can reuse existing helpers.
    request.user = {
      userId: principal.userId,
      id: principal.userId,
      email: principal.email,
      role: principal.role,
      sessionId: payload.sid,
    };
    return true;
  }
}
