import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenRouterService } from './openrouter.service';
import { DataPermissionsModule } from './data-permissions/data-permissions.module';
import { WsAuthService } from './ws-auth/ws-auth.service';
import { WsRateLimiter } from './ws-auth/ws-rate-limiter';
import { CsrfGuard } from './csrf/csrf.guard';
import { LoginSession } from '../auth/entities/login-session.entity';

/**
 * Shared infrastructure module.
 *
 * Exports `OpenRouterService` (LLM wrapper), `WsAuthService` (Socket.IO
 * handshake authentication), `WsRateLimiter` (per-socket message limiting), and
 * `CsrfGuard` (double-submit CSRF check for session-authenticated routes).
 * Marked `@Global()` to avoid re-importing in every consumer module — just
 * importing `CommonModule` in `app.module.ts` is sufficient to make all four
 * injectable everywhere.
 */
@Global()
@Module({
  imports: [
    HttpModule,
    DataPermissionsModule,
    ConfigModule,
    TypeOrmModule.forFeature([LoginSession]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [OpenRouterService, WsAuthService, WsRateLimiter, CsrfGuard],
  exports: [OpenRouterService, WsAuthService, WsRateLimiter, CsrfGuard, DataPermissionsModule],
})
export class CommonModule {}
