import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * System wallet that holds the platform's 10% share of creator revenue.
 * Fixed id so ledger entries and payment splits can reference it forever.
 */
export class PlatformSystemUser1789200000000 implements MigrationInterface {
  name = 'PlatformSystemUser1789200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO users (id, username, "displayName", email, "walletBalance", "emailVerified")
      SELECT
        '00000000-0000-4000-8000-000000000001',
        'platform',
        'Zynkra Platform',
        'platform@zynkra.local',
        0,
        true
      WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE id = '00000000-0000-4000-8000-000000000001'
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM users
      WHERE id = '00000000-0000-4000-8000-000000000001'
        AND NOT EXISTS (
          SELECT 1 FROM ledger_entries WHERE "userId" = '00000000-0000-4000-8000-000000000001'
        );
    `);
  }
}
