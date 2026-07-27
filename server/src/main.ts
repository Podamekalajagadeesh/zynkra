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
import { ValidationPipe } from '@nestjs/common';

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

  const clientUrl = configService.get<string>('CLIENT_URL') || 'http://127.0.0.1:5173';
  const devOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8081', // For mobile app development
    'http://127.0.0.1:8081',
  ];
  const allowedOrigins = [...new Set([clientUrl, ...devOrigins].filter(Boolean))];

  // Security headers. CSP is configured to allow resources from the server
  // itself ('self') and the configured client applications. COEP is set to
  // 'credentialless' as a safer default than 'disabled', which helps
  // mitigate some cross-origin attacks without the strictness of 'require-corp'.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          scriptSrc: [`'self'`, ...allowedOrigins],
          // 'unsafe-inline' is needed for some libraries. A long-term fix would be to remove it.
          styleSrc: [`'self'`, `'unsafe-inline'`, ...allowedOrigins],
          imgSrc: [`'self'`, 'data:', ...allowedOrigins],
          connectSrc: [`'self'`, ...allowedOrigins],
          fontSrc: [`'self'`, ...allowedOrigins],
          objectSrc: [`'none'`],
          frameSrc: [`'self'`, ...allowedOrigins],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: { policy: 'credentialless' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  // Global ValidationPipe enables class-validator DTO decorators. Unknown
  // properties are stripped (whitelist) but not rejected (forbidNonWhitelisted:
  // false) to avoid breaking existing endpoints that pass extra fields.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

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