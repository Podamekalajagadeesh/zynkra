import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoryElementConstraints1793300000000 implements MigrationInterface {
  name = 'StoryElementConstraints1793300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Orphan elements (nullable storyId pre-constraint) can't survive NOT NULL.
    await queryRunner.query(`DELETE FROM "story_elements" WHERE "storyId" IS NULL`);
    await queryRunner.query(`ALTER TABLE "story_elements" ALTER COLUMN "storyId" SET NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_story_elements_storyId" ON "story_elements" ("storyId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_story_elements_storyId"`);
    await queryRunner.query(`ALTER TABLE "story_elements" ALTER COLUMN "storyId" DROP NOT NULL`);
  }
}
