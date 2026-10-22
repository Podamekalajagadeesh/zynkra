import { MigrationInterface, QueryRunner } from 'typeorm';

export class MediaOwnership1789000000000 implements MigrationInterface {
  name = 'MediaOwnership1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "media" ADD "userId" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_media_userId" ON "media" ("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_media_userId"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "userId"`);
  }
}
