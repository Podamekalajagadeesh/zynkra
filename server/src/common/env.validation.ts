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
  JWT_AUDIENCE: Joi.string().min(1).default('zynkra-api').optional(),
  JWT_2FA_SECRET: Joi.string().min(32).optional(),

  // Require a CAPTCHA on signin as well as signup. Off by default so existing
  // clients that do not send a challenge keep working; when on, POST /auth/signin
  // fails without a valid captchaId + captchaAnswer.
  CAPTCHA_REQUIRED_ON_SIGNIN: Joi.string().valid('true', 'false').optional().default('false'),

  // Risk-based CAPTCHA escalation. Once an identifier has this many failed
  // sign-ins inside the window, a CAPTCHA is demanded even when
  // CAPTCHA_REQUIRED_ON_SIGNIN is off. Counted from security_audit_logs, so it
  // is shared across instances. 0 disables the risk trigger.
  CAPTCHA_FAILURE_THRESHOLD: Joi.number().integer().min(0).default(3),
  CAPTCHA_FAILURE_WINDOW_MINUTES: Joi.number().integer().min(1).default(15),

  // Double-submit CSRF protection for the session-authenticated routes
  // (webauthn verification, SIWE verify, wallet connect). Bearer-token requests
  // and safe methods always bypass the check, so this only affects flows whose
  // sole credential is the session cookie. Set false to disable.
  CSRF_PROTECTION_ENABLED: Joi.string().valid('true', 'false').optional().default('true'),
  CSRF_COOKIE_NAME: Joi.string().min(1).default('zynkra.csrf').optional(),

  // Server-side idle timeout, in minutes, applied on every authenticated
  // request against LoginSession.lastSeenAt. An expired session is revoked.
  // 0 disables it, which is the default: existing deployments rely on JWT
  // expiry alone, and turning this on logs users out mid-workflow.
  SESSION_IDLE_TIMEOUT_MINUTES: Joi.number().integer().min(0).default(0),

  // Email verification code redemption. The code is 6 digits, so a per-account
  // attempt counter with a lockout is the real barrier; the per-IP throttle is
  // only the first of two.
  VERIFICATION_CODE_MAX_ATTEMPTS: Joi.number().integer().min(1).default(5),
  VERIFICATION_CODE_LOCKOUT_MINUTES: Joi.number().integer().min(1).default(15),
  SESSION_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'SESSION_SECRET is not set — see server/.env.example',
    'string.min': 'SESSION_SECRET must be at least 32 characters',
  }),

  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').default('postgres'),
  DB_DATABASE: Joi.string().default('zynkra'),
  DB_MIGRATIONS_RUN: Joi.string().valid('true', 'false').default('true'),

  CLIENT_URL: Joi.string().uri().optional(),
  PORT: Joi.number().port().default(3000),

  // Reverse-proxy hops to trust for X-Forwarded-For. `1` matches a typical
  // single-proxy deploy. Set to `false` when the server is directly exposed.
  // NEVER set `true`: that means "believe any client's forwarded header", which
  // lets a client spoof its IP and defeat new-device login detection.
  TRUST_PROXY: Joi.alternatives()
    .try(Joi.boolean(), Joi.number().integer().min(0), Joi.string().valid('false', 'true'))
    .default(1),

  // Bound on the in-memory translation cache. The cache key includes
  // attacker-supplied text, so it must not be able to grow without limit.
  TRANSLATION_CACHE_MAX_ENTRIES: Joi.number().integer().min(0).default(1000),

  // WebSocket / real-time.
  // Allowed socket origins, comma-separated. Falls back to CLIENT_URL, plus the
  // local dev origins when NODE_ENV is not production. In production an empty
  // value means sockets accept no browser origin.
  WS_ALLOWED_ORIGINS: Joi.string().allow('').optional(),
  // Inbound socket messages allowed per socket per minute. Once exceeded the
  // message is dropped; after WS_RATE_LIMIT_CLOSE_AFTER consecutive violations
  // the socket is disconnected.
  WS_RATE_LIMIT_PER_MINUTE: Joi.number().integer().min(1).default(240),
  WS_RATE_LIMIT_CLOSE_AFTER: Joi.number().integer().min(1).default(5),

  // The /mobile/feed + /mobile/posts demo endpoints serve a hardcoded in-memory
  // array and accept unauthenticated writes. Off by default; only enable for
  // local Expo prototyping. The mobile client should use the real API instead.
  MOBILE_DEMO_ENDPOINTS_ENABLED: Joi.string().valid('true', 'false').optional().default('false'),

  // Media / uploads (local disk backend; optional CDN origin)
  UPLOAD_DIR: Joi.string().optional().default('./uploads'),
  CDN_BASE_URL: Joi.string().uri().allow('').optional(),

  // Data-export archives: private directory (never statically served) and
  // retention window in days (0 disables pruning entirely).
  EXPORT_DIR: Joi.string().optional().default('./exports'),
  EXPORT_RETENTION_DAYS: Joi.number().integer().min(0).max(365).optional().default(30),

  // Observability (optional — features are off when unset)
  SENTRY_DSN: Joi.string().uri().allow('').optional(),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).optional(),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').optional(),

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
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().port().optional(),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  FROM_EMAIL: Joi.string().email().optional(),

  // AI / OpenRouter (optional — features fall back to templates when unset)
  OPENROUTER_API_KEY: Joi.string().allow('').optional(),
  OPENROUTER_BASE_URL: Joi.string().uri().optional().default('https://openrouter.ai/api/v1'),
  AI_TEXT_MODEL: Joi.string().optional().default('openai/gpt-4o-mini'),
  AI_VISION_MODEL: Joi.string().optional().default('openai/gpt-4o'),
  AI_ANALYSIS_MODEL: Joi.string().optional().default('openai/gpt-4o-mini'),
  AI_FALLBACK_ENABLED: Joi.string().valid('true', 'false').optional().default('true'),
});
