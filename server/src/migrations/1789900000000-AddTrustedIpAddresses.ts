import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Persist trusted IP addresses on the user.
 *
 * These lived only in an in-process `Map` inside `SecuritySettingsService`, so
 * the control was cosmetic: adding a trusted IP did not suppress the
 * new-device/suspicious-login prompt (because `isSuspiciousSession` never
 * consulted anything), and the list was lost on every restart.
 */
export class AddTrustedIpAddresses1789900000000 implements MigrationInterface {
  name = 'AddTrustedIpAddresses1789900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS "trustedIpAddresses" TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS "trustedIpAddresses";`);
  }
}
