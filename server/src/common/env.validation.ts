import * as Joi from 'joi';

// Startup-time validation of environment variables (wired into ConfigModule in
// app.module.ts). Fail fast with a clear message instead of a runtime crash
// deep in a request. Unknown keys are allowed — modules read many optional
// vars (Stripe, LiveKit, SMTP, ...) that are validated where they're used.
export const envValidationSchema = Joi.object({
  // Required secrets — no defaults, refuse to boot without them.
  JWT_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_SECRET is not set — see server/.env.example',
    'string.min': 'JWT_SECRET must be at least 32 characters',
  }),
  SESSION_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'SESSION_SECRET is not set — see server/.env.example',
    'string.min': 'SESSION_SECRET must be at least 32 characters',
  }),

  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').default('postgres'),
  DB_DATABASE: Joi.string().default('zynkra'),
  DB_MIGRATIONS_RUN: Joi.string().valid('true', 'false').default('true'),

  CLIENT_URL: Joi.string().uri().optional(),
  PORT: Joi.number().port().default(3000),

  // Observability (optional — features are off when unset)
  SENTRY_DSN: Joi.string().uri().optional(),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).optional(),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .optional(),

  // Payments
  PAYMENTS_ENABLED: Joi.string().valid('true', 'false').optional(),
  STRIPE_SECRET_KEY: Joi.string().allow('').optional(),
});
