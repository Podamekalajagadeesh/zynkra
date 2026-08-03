import { MigrationInterface, QueryRunner } from 'typeorm';

export class TipLeaderboardIndex1786952000000 implements MigrationInterface {
  name = 'TipLeaderboardIndex1786952000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Leaderboard reads GROUP BY "toId" ORDER BY SUM(amount) over a period —
    // index the recipient + created_at so the aggregate stays fast.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tip_recipient_created" ON "tip" ("toId", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tip_recipient_created"`);
  }
}
