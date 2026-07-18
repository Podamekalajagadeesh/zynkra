import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { LoginSession } from '../entities/login-session.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(LoginSession)
    private readonly loginSessionsRepository: Repository<LoginSession>,
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
    if (!payload.sid) {
      return { userId: payload.sub, email: payload.email, sessionId: null };
    }

    const session = await this.loginSessionsRepository.findOne({
      where: { id: payload.sid },
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session is missing or expired.');
    }

    await this.loginSessionsRepository.update(session.id, {
      lastSeenAt: new Date(),
    });

    return { userId: payload.sub, email: payload.email, sessionId: session.id };
  }
}