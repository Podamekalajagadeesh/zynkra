import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostPrivacyVisibility1788670000000 implements MigrationInterface {
  name = 'AddPostPrivacyVisibility1788670000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."posts_visibility_enum" ADD VALUE IF NOT EXISTS 'friends'`);
    await queryRunner.query(`ALTER TYPE "public"."posts_visibility_enum" ADD VALUE IF NOT EXISTS 'only_me'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values in place. Existing rows
    // are normalized before rebuilding the type so the migration remains reversible.
    await queryRunner.query(`UPDATE "posts" SET "visibility" = 'private' WHERE "visibility" IN ('friends', 'only_me')`);
    await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "visibility" TYPE text`);
    await queryRunner.query(`DROP TYPE "public"."posts_visibility_enum"`);
    await queryRunner.query(`CREATE TYPE "public"."posts_visibility_enum" AS ENUM('public', 'private', 'unlisted', 'profile_only')`);
    await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "visibility" TYPE "public"."posts_visibility_enum" USING "visibility"::text::"public"."posts_visibility_enum"`);
  }
}