import { MigrationInterface, QueryRunner } from 'typeorm';

export class MediaSortOrder1786950000000 implements MigrationInterface {
  name = 'MediaSortOrder1786950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Carousel slide order — new media rows get their array index; existing
    // rows default to 0 (single-media posts are unaffected).
    await queryRunner.query(
      `ALTER TABLE "media" ADD "sortOrder" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "sortOrder"`);
  }
}
