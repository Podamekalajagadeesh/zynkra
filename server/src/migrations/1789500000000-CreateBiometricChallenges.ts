import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the biometric device tables.
 *
 * HISTORY: `1789500000000-CreateBiometricChallenges` briefly created
 * `biometric_challenges` for the now-removed `/auth/biometric/*` endpoints. That
 * surface duplicated what `/auth/webauthn/*` (passkeys) already implemented
 * correctly, had no callers anywhere in the client, and its `biometric_devices`
 * table never had a migration at all — so with `synchronize: false` those routes
 * could not have worked on a cleanly-migrated database.
 *
 * This migration supersedes it, so the created-then-dropped pair cancels out.
 * It is also tolerant of databases where the table never existed, which covers
 * both a clean production database and legacy dev databases that were originally
 * built under `synchronize: true`.
 */
export class DropBiometricDevices1789500000000 implements MigrationInterface {
  name = 'DropBiometricDevices1789500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_biometric_challenges_expires_at;`);
    await queryRunner.query(`DROP TABLE IF EXISTS biometric_challenges;`);
    // Never migrated, but a legacy `synchronize: true` dev database will have it.
    await queryRunner.query(`DROP TABLE IF EXISTS biometric_devices;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Intentionally not reversible. Recreating a table for a deleted feature
    // would only make it look supported again.
    await queryRunner.query(`SELECT 1;`);
  }
}
