import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Durable record of applied bias mitigations.
 *
 * `applyBiasMitigations` pushed into an in-process array that nothing read, so
 * the endpoint returned `success: true` while leaving no audit trail — the
 * record vanished on restart and was invisible to any other instance.
 */
export class CreateModerationMitigations1789800000000 implements MigrationInterface {
  name = 'CreateModerationMitigations1789800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS moderation_mitigations (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        strategy     JSONB NOT NULL,
        "appliedById" UUID REFERENCES users(id) ON DELETE SET NULL,
        "appliedAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
        "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_moderation_mitigations_applied_at
        ON moderation_mitigations ("appliedAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_moderation_mitigations_applied_at;`);
    await queryRunner.query(`DROP TABLE IF EXISTS moderation_mitigations;`);
  }
}
