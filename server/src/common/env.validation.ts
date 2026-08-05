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
  // Access-token lifetime. JWT_EXPIRES_IN applies to normal logins; the
  // "remember me" flow uses a longer lifetime via JWT_REMEMBER_ME_EXPIRES.
  JWT_EXPIRES_IN: Joi.string().default('60m').optional(),
  JWT_REMEMBER_ME_EXPIRES: Joi.string().default('30d').optional(),
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

  // Federation / ActivityPub
  FEDERATION_ENABLED: Joi.string().valid('true', 'false').optional().default('false'),
  INSTANCE_DOMAIN: Joi.string().domain().optional(),
  INSTANCE_BASE_URL: Joi.string().uri().optional(),

  // Crypto / Blockchain payouts
  CRYPTO_PAYOUTS_ENABLED: Joi.string().valid('true', 'false').optional().default('false'),
  CRYPTO_PAYOUT_PRIVATE_KEY: Joi.string().allow('').optional(),
  CRYPTO_PAYOUT_CHAINS: Joi.string().optional().default('8453'),

  // Email / SMTP (optional — console-logged when unset)
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().port().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  FROM_EMAIL: Joi.string().email().optional(),

  // AI / OpenRouter (optional — features fall back to templates when unset)
  OPENROUTER_API_KEY: Joi.string().optional(),
  OPENROUTER_BASE_URL: Joi.string().uri().optional().default('https://openrouter.ai/api/v1'),
  AI_TEXT_MODEL: Joi.string().optional().default('openai/gpt-4o-mini'),
  AI_VISION_MODEL: Joi.string().optional().default('openai/gpt-4o'),
  AI_ANALYSIS_MODEL: Joi.string().optional().default('openai/gpt-4o-mini'),
  AI_FALLBACK_ENABLED: Joi.string().valid('true', 'false').optional().default('true'),
});
