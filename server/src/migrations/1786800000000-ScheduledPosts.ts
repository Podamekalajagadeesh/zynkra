import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScheduledPosts1786800000000 implements MigrationInterface {
  name = 'ScheduledPosts1786800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "scheduled_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "content" text NOT NULL, "media_url" character varying, "post_type" character varying(30) NOT NULL DEFAULT 'feed', "scheduled_for" TIMESTAMP WITH TIME ZONE NOT NULL, "is_optimal_time" boolean NOT NULL DEFAULT false, "status" character varying(20) NOT NULL DEFAULT 'scheduled', "visibility" character varying(20), "cross_platform_ids" jsonb, "cross_platform_status" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "published_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_scheduled_posts_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_scheduled_posts_user_id" ON "scheduled_posts" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_scheduled_posts_status_due" ON "scheduled_posts" ("status", "scheduled_for")`);
    await queryRunner.query(
      `ALTER TABLE "scheduled_posts" ADD CONSTRAINT "FK_scheduled_posts_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scheduled_posts" DROP CONSTRAINT "FK_scheduled_posts_user_id"`);
    await queryRunner.query(`DROP TABLE "scheduled_posts"`);
  }
}
