import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContentFeatures1786500000000 implements MigrationInterface {
  name = 'ContentFeatures1786500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Distinct "shorts" content type for short-form video.
    await queryRunner.query(
      `ALTER TYPE "public"."posts_posttype_enum" ADD VALUE IF NOT EXISTS 'shorts'`,
    );
    // Boosted posts: flag + expiry so feeds can badge/rank them.
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "isBoosted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "boostExpiresAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "boostExpiresAt"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "isBoosted"`);
    // Enum value removal requires recreating the type; skip for down migration.
  }
}
