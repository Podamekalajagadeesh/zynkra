import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserPrivacySettings1788100300000 implements MigrationInterface {
  name = 'UserPrivacySettings1788100300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "readReceipts" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contactDiscovery" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "personalization" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "adPersonalization" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mentions" character varying NOT NULL DEFAULT 'everyone'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "activityVisibility" character varying NOT NULL DEFAULT 'friends'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "storyVisibility" character varying NOT NULL DEFAULT 'friends'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "searchVisibility" character varying NOT NULL DEFAULT 'everyone'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "searchVisibility"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "storyVisibility"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "activityVisibility"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "mentions"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "adPersonalization"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "personalization"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "contactDiscovery"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "readReceipts"`);
  }
}
