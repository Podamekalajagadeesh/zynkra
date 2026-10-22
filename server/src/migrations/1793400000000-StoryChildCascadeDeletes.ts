import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoryChildCascadeDeletes1793400000000 implements MigrationInterface {
  name = 'StoryChildCascadeDeletes1793400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Story delete() only cleared views manually and handleCron() cleared nothing:
    // with any dependent row, story deletion (and the hourly cleanup) failed on
    // NO ACTION. Align story children with the story_elements FK (ON DELETE CASCADE).
    await queryRunner.query(
      `ALTER TABLE "story_reactions" DROP CONSTRAINT "FK_c84d05d9a9a5c3c9af7ea92608d"`
    );
    await queryRunner.query(
      `ALTER TABLE "story_reactions" ADD CONSTRAINT "FK_c84d05d9a9a5c3c9af7ea92608d" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "story_replies" DROP CONSTRAINT "FK_84f43f60f7292b4e7fff9cb9c2b"`
    );
    await queryRunner.query(
      `ALTER TABLE "story_replies" ADD CONSTRAINT "FK_84f43f60f7292b4e7fff9cb9c2b" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "story_views" DROP CONSTRAINT "FK_59936d984aae9f264b569d35c9c"`
    );
    await queryRunner.query(
      `ALTER TABLE "story_views" ADD CONSTRAINT "FK_59936d984aae9f264b569d35c9c" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    // One reaction per (story, user): collapse duplicates before the unique index
    // (story_reactions has no createdAt column, so any surviving row is fine).
    await queryRunner.query(
      `DELETE FROM "story_reactions" a USING "story_reactions" b WHERE a."storyId" = b."storyId" AND a."userId" = b."userId" AND a.ctid < b.ctid`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_story_reactions_story_user" ON "story_reactions" ("storyId", "userId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_story_reactions_story_user"`);
    await queryRunner.query(
      `ALTER TABLE "story_views" DROP CONSTRAINT "FK_59936d984aae9f264b569d35c9c"`
    );
    await queryRunner.query(
      `ALTER TABLE "story_views" ADD CONSTRAINT "FK_59936d984aae9f264b569d35c9c" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "story_replies" DROP CONSTRAINT "FK_84f43f60f7292b4e7fff9cb9c2b"`
    );
    await queryRunner.query(
      `ALTER TABLE "story_replies" ADD CONSTRAINT "FK_84f43f60f7292b4e7fff9cb9c2b" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "story_reactions" DROP CONSTRAINT "FK_c84d05d9a9a5c3c9af7ea92608d"`
    );
    await queryRunner.query(
      `ALTER TABLE "story_reactions" ADD CONSTRAINT "FK_c84d05d9a9a5c3c9af7ea92608d" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
