import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoryRepliesStoryIndex1793600000000 implements MigrationInterface {
  name = 'StoryRepliesStoryIndex1793600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The new owner inbox lists replies with
    // WHERE "storyId" = ? ORDER BY "createdAt" DESC; FK columns carry no
    // auto-index in PostgreSQL, so back the (bounded but unindexed) table.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_story_replies_story_createdAt" ON "story_replies" ("storyId", "createdAt")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_story_replies_story_createdAt"`);
  }
}
