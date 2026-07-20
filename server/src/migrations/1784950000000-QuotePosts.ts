import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuotePosts1784950000000 implements MigrationInterface {
  name = 'QuotePosts1784950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" ADD "quotedPostId" uuid`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "quoteCount" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_posts_quotedPost" FOREIGN KEY ("quotedPostId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_quotedPost"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "quoteCount"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "quotedPostId"`);
  }
}
