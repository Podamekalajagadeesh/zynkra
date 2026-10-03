import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Persistent store for `express-session`.
 *
 * The server previously used the default `MemoryStore`, which means every
 * session-backed security flow — the WebAuthn registration/authentication
 * challenges, the SIWE nonce, and the wallet-link nonce — was single-instance
 * only and lost on every restart. Horizontal scaling or a redeploy silently
 * broke passkey sign-in and wallet sign-in.
 *
 * Keyed by the session cookie signature (`s:<sid>.<hmac>`), matching
 * express-session's `cookieId` contract.
 */
export class CreateSessionStore1789400000000 implements MigrationInterface {
  name = 'CreateSessionStore1789400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid        VARCHAR NOT NULL PRIMARY KEY,
        sess       JSON    NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    // `get` filters on expiry, so the index has to cover it.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sessions_expires_at;`);
    await queryRunner.query(`DROP TABLE IF EXISTS sessions;`);
  }
}
