import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `reputation_log.points` was created as `integer`, but ReputationService
 * awards fractional points (INTERACTION_RECEIVED = 0.5), so inserting a log
 * row for that event failed with
 * `invalid input syntax for type integer: "0.5"` — crashing every comment
 * creation (comments.service awards the post/parent author 0.5). Sibling
 * columns (`reputation.score`, `reputation_log.cryptocurrencyEarned`) are
 * already numeric(10,2); this aligns `points` with them.
 */
export class ReputationLogPointsFractional1792325581000 implements MigrationInterface {
  name = 'ReputationLogPointsFractional1792325581000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reputation_log"
      ALTER COLUMN "points" TYPE numeric(10,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Round rather than fail outright if fractional rows exist.
    await queryRunner.query(`
      ALTER TABLE "reputation_log"
      ALTER COLUMN "points" TYPE integer
      USING round("points")
    `);
  }
}
