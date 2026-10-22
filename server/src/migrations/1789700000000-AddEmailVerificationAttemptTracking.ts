import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-account attempt counter for email-verification code redemption.
 *
 * The code is 6 digits (1,000,000 possibilities) with a 1-hour lifetime, and
 * `verifyByCode` had no per-account failure counter — the per-IP throttle was
 * the only barrier, so a patient attacker with a few IPs could grind the space
 * over a few days. These columns allow a cooling-off lockout.
 */
export class AddEmailVerificationAttemptTracking1789700000000 implements MigrationInterface {
  name = 'AddEmailVerificationAttemptTracking1789700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS "emailVerificationAttempts" INTEGER NOT NULL DEFAULT 0;
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS "emailVerificationLockedUntil" TIMESTAMP;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN IF EXISTS "emailVerificationLockedUntil";`
    );
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS "emailVerificationAttempts";`);
  }
}
