import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoryPrivacyControls1788700000000 implements MigrationInterface {
  name = 'StoryPrivacyControls1788700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."stories_audience_enum" ADD VALUE IF NOT EXISTS 'custom'`);
    await queryRunner.query(`ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "customAudienceId" uuid`);
    await queryRunner.query(`ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "excludedUserIds" jsonb NOT NULL DEFAULT '[]'`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_stories_customAudienceId" ON "stories" ("customAudienceId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stories_customAudienceId"`);
    await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN IF EXISTS "excludedUserIds"`);
    await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN IF EXISTS "customAudienceId"`);
  }
}