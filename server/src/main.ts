import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';

if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = { randomUUID };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

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
  const sessionSecret =
    configService.get<string>('SESSION_SECRET') || 'dev-session-secret-2026';

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: configService.get('NODE_ENV') === 'production' },
    }),
  );
  await app.listen(3000);
}
bootstrap();