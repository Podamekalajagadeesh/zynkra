// Sentry instrumentation must load before any other import.
import './instrument';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import helmet from 'helmet';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';

if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = { randomUUID };
}

async function bootstrap() {
  // rawBody is required for Stripe webhook signature verification.
  // bufferLogs holds early logs until the pino logger is attached.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  const configService = app.get(ConfigService);

  // Security headers. CSP and COEP are disabled: the server serves the SPA
  // and user-uploaded media cross-origin (client dev server, mobile app).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const clientUrl = configService.get<string>('CLIENT_URL') || 'http://127.0.0.1:5173';
  const allowedOrigins = [
    clientUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  // SESSION_SECRET presence/strength is enforced by env validation (common/env.validation.ts).
  const sessionSecret = configService.get<string>('SESSION_SECRET');

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: configService.get('NODE_ENV') === 'production' },
    }),
  );
  await app.listen(configService.get<number>('PORT', 3000));
}
bootstrap();