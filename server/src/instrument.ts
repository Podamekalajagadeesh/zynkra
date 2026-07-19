import * as Sentry from '@sentry/nestjs';
import { config } from 'dotenv';

// Must be the FIRST import in main.ts so Sentry can instrument everything
// that loads after it. ConfigModule hasn't run yet, so load .env ourselves.
config({ path: '.env' });

// No-op unless SENTRY_DSN is set — local dev and CI run without Sentry.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
  });
}
