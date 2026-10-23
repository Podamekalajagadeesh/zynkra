import { MigrationInterface, QueryRunner } from 'typeorm';

export class HighlightCreatedAt1793500000000 implements MigrationInterface {
  name = 'HighlightCreatedAt1793500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "story_highlights" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "story_highlights" DROP COLUMN "createdAt"`);
  }
}
