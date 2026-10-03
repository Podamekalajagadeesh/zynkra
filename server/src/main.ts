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
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DocumentationService } from './documentation/documentation.service';
import { PostgresSessionStore } from './common/session-store/postgres-session.store';

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

  // Reverse-proxy trust. `req.ip` (and therefore `req.protocol`, `req.hostname`,
  // secure cookies, and the login-session IP used for new-device detection) is
  // only derived from `x-forwarded-for` when this is set. Leaving it unset made
  // those fields forgeable; setting it to `true` is worse, since a client could
  // then spoof any address. Default to a single hop, which matches a typical
  // one-proxy deploy, and let TRUST_PROXY override.
  const trustProxySetting = configService.get<string>('TRUST_PROXY', '1');
  let trustProxy: number | false;
  if (trustProxySetting === 'false') {
    trustProxy = false;
  } else if (trustProxySetting === 'true') {
    // Disallowed on purpose: it would let a client spoof any forwarded header.
    throw new Error(
      "TRUST_PROXY=true is unsafe — it means \"believe any client's X-Forwarded-For\". " +
        'Use a hop count (e.g. 1) or false.',
    );
  } else {
    const hops = Number(trustProxySetting);
    // `0` means "trust no proxies", which is a legitimate setting and must not
    // be coerced to 1 by a truthiness check.
    trustProxy = Number.isInteger(hops) && hops >= 0 ? hops : 1;
  }
  app.set('trust proxy', trustProxy);

  const clientUrl = configService.get<string>('CLIENT_URL') || 'http://127.0.0.1:5173';
  const devOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8081', // For mobile app development
    'http://127.0.0.1:8081',
  ];
  const allowedOrigins = [...new Set([clientUrl, ...devOrigins].filter(Boolean))];
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

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
          // Only meaningful over TLS, and actively harmful in local HTTP dev
          // where it upgrades http:// asset requests to https:// and breaks them.
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: { policy: 'credentialless' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // The app serves the built SPA from the same origin as the API, and the
      // session cookie is set on that origin.
      hsts: isProduction ? { maxAge: 15_552_000, includeSubDomains: true } : false,
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
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // SESSION_SECRET presence/strength is enforced by env validation (common/env.validation.ts).
  const sessionSecret = configService.get<string>('SESSION_SECRET');

  // Persist sessions in Postgres rather than the default MemoryStore. The
  // WebAuthn challenges, the SIWE nonce, and the wallet-link nonce all live in
  // the session; with MemoryStore they were lost on restart and invisible to
  // every instance but one, so passkey and wallet sign-in broke under
  // horizontal scaling.
  const sessionStore = new PostgresSessionStore(configService);

  app.use(
    session({
      name: 'zynkra.sid',
      secret: sessionSecret,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      proxy: trustProxy !== false,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        // `Lax` still sends the cookie on top-level GET navigations, which is
        // what the email-verification landing page needs. `Strict` would break
        // that; `None` would require Secure everywhere including local dev.
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.enableShutdownHooks();

  // Public REST API docs — mounted at /docs. Auth'd endpoints carry a bearer
  // token description; no prefix is added so existing routes are unchanged.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Zynkra API')
    .setDescription('Zynkra — a decentralized social platform. Interactive API docs.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);
  app.get(DocumentationService).setOpenApiDocument(swaggerDocument);

  await app.listen(configService.get<number>('PORT', 3000));
}
bootstrap();