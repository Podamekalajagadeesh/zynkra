import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { LoginSession } from '../entities/login-session.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(LoginSession)
    private readonly loginSessionsRepository: Repository<LoginSession>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is not set. Refusing to start with an insecure default — see server/.env.example.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const audience = this.configService.get<string>('JWT_AUDIENCE', 'zynkra-api');
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string' ||
      (payload.typ !== undefined && payload.typ !== 'access') ||
      (payload.aud !== undefined && !audiences.includes(audience))
    ) {
      throw new UnauthorizedException('Invalid access token.');
    }

    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
    if (!user || user.status === 'deactivated' || user.banned) {
      throw new UnauthorizedException('Account is inactive.');
    }

    const session = await this.loginSessionsRepository.findOne({
      where: { id: payload.sid, user: { id: payload.sub } },
      relations: ['user'],
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session is missing or expired.');
    }

    // Idle timeout. Previously the `sessionTimeout` / `sessionTimeoutMinutes`
    // settings were stored in an in-process map that nothing ever read, so a
    // session that the user believed would time out stayed valid until it
    // expired or was explicitly revoked. This enforces it server-side.
    const idleMinutes = this.configService.get<number>('SESSION_IDLE_TIMEOUT_MINUTES', 0);
    if (idleMinutes > 0 && session.lastSeenAt) {
      const idleMs = Date.now() - new Date(session.lastSeenAt).getTime();
      if (idleMs > idleMinutes * 60_000) {
        await this.loginSessionsRepository.update(session.id, {
          revokedAt: new Date(),
        });
        throw new UnauthorizedException('Session expired due to inactivity.');
      }
    }

    await this.loginSessionsRepository.update(session.id, {
      lastSeenAt: new Date(),
    });

    // `role` MUST be included: AdminGuard and RolesGuard read `user.role` from
    // here, and without it every role-gated route is 403 for every user
    // (including real admins).
    //
    // `id` is an alias of `userId`, not a separate value. Many handlers are
    // annotated `@CurrentUser() user: User` because they pass the principal
    // straight into a service, and `User` has `id` but not `userId`. Without
    // the alias those services silently receive `undefined` as the owner id.
    // New code should read `userId`, which is the canonical field.
    return {
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    };
  }
}