import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { Store } from 'express-session';
import type { SessionData } from 'express-session';

type SessionCallback = (err?: any, session?: SessionData | null) => void;

interface StoredRow {
  sess: SessionData;
}

/**
 * Postgres-backed `express-session` store.
 *
 * Replaces the default `MemoryStore`, which made every session-backed security
 * flow single-instance only and volatile across restarts: the WebAuthn
 * challenges (`/auth/webauthn/*`), the SIWE nonce (`/siwe/*`), and the
 * wallet-link nonce (`/wallet/connect/challenge`) all live in the session.
 *
 * Uses the `pg` driver directly against the same database as the rest of the
 * app, so no additional infrastructure is required.
 */
@Injectable()
export class PostgresSessionStore extends Store implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresSessionStore.name);
  private readonly pool: Pool;
  private readonly cleanupTimer?: NodeJS.Timeout;

  constructor(configService: ConfigService) {
    super();
    this.pool = new Pool({
      host: configService.get<string>('DB_HOST', 'localhost'),
      port: configService.get<number>('DB_PORT', 5432),
      user: configService.get<string>('DB_USERNAME', 'postgres'),
      password: configService.get<string>('DB_PASSWORD', 'postgres'),
      database: configService.get<string>('DB_DATABASE', 'zynkra'),
      max: 5,
    });

    // Fail loudly rather than silently falling back to an in-memory store,
    // which is what made this failure invisible before.
    this.pool.on('error', (err) => {
      this.logger.error(`Session store pool error: ${err.message}`);
    });

    // Expired rows are never read, so prune them periodically. Sessions live
    // at most a day here (WebAuthn challenges resolve in seconds), so a
    // generous TTL is safe.
    this.cleanupTimer = setInterval(() => {
      void this.prune().catch((err) =>
        this.logger.warn(`Session prune failed: ${err.message}`),
      );
    }, 60 * 60 * 1000);
    this.cleanupTimer.unref?.();
  }

  private expiryOf(session: SessionData): Date {
    const cookieExpiry = session?.cookie?.expires;
    if (cookieExpiry) {
      return new Date(cookieExpiry);
    }
    const maxAge = session?.cookie?.originalMaxAge;
    const ttl = typeof maxAge === 'number' ? maxAge : 24 * 60 * 60 * 1000;
    return new Date(Date.now() + ttl);
  }

  override get(sid: string, callback: SessionCallback): void {
    this.pool
      .query<StoredRow>(
        `SELECT sess FROM sessions WHERE sid = $1 AND expires_at > now()`,
        [sid],
      )
      .then((result) => {
        const row = result.rows[0];
        if (!row) {
          return callback(null, null);
        }
        let parsed: SessionData;
        try {
          // `pg` already parses a `json` column, but a text-typed column or a
          // hand-edited row can still hand back a string.
          parsed = typeof row.sess === 'string' ? JSON.parse(row.sess) : row.sess;
        } catch {
          // A corrupt row is dead weight; drop it rather than 500 on every hit.
          void this.destroy(sid, () => undefined);
          return callback(null, null);
        }
        callback(null, parsed);
      })
      .catch((err) => callback(err as Error));
  }

  override set(sid: string, session: SessionData, callback?: SessionCallback): void {
    const expiresAt = this.expiryOf(session);
    this.pool
      .query(
        `INSERT INTO sessions (sid, sess, expires_at)
         VALUES ($1, $2::json, $3)
         ON CONFLICT (sid) DO UPDATE
           SET sess = EXCLUDED.sess, expires_at = EXCLUDED.expires_at`,
        [sid, JSON.stringify(session), expiresAt.toISOString()],
      )
      .then(() => callback?.(null))
      .catch((err) => callback?.(err as Error));
  }

  override destroy(sid: string, callback?: SessionCallback): void {
    this.pool
      .query(`DELETE FROM sessions WHERE sid = $1`, [sid])
      .then(() => callback?.(null))
      .catch((err) => callback?.(err as Error));
  }

  override touch(sid: string, session: SessionData, callback?: SessionCallback): void {
    this.pool
      .query(`UPDATE sessions SET expires_at = $2 WHERE sid = $1`, [
        sid,
        this.expiryOf(session).toISOString(),
      ])
      .then(() => callback?.(null))
      .catch((err) => callback?.(err as Error));
  }

  override length(callback: (err: any, length: number) => void): void {
    this.pool
      .query<{ count: string }>(
        `SELECT count(*)::text AS count FROM sessions WHERE expires_at > now()`,
      )
      .then((result) => callback(null, Number(result.rows[0]?.count ?? 0)))
      .catch((err) => callback(err, 0));
  }

  override clear(callback?: SessionCallback): void {
    this.pool
      .query(`DELETE FROM sessions`)
      .then(() => callback?.(null))
      .catch((err) => callback?.(err as Error));
  }

  private async prune(): Promise<void> {
    const result = await this.pool.query(`DELETE FROM sessions WHERE expires_at <= now()`);
    if (result.rowCount && result.rowCount > 0) {
      this.logger.debug(`Pruned ${result.rowCount} expired session(s)`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    await this.pool.end().catch(() => undefined);
  }
}
