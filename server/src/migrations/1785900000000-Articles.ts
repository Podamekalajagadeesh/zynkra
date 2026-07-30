import { MigrationInterface, QueryRunner } from 'typeorm';

export class Articles1785900000000 implements MigrationInterface {
  name = 'Articles1785900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "articles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying NOT NULL,
        "title" character varying(500) NOT NULL,
        "subtitle" text NOT NULL DEFAULT '',
        "content" text NOT NULL,
        "excerpt" text,
        "coverImage" character varying,
        "authorId" uuid,
        "status" character varying NOT NULL DEFAULT 'draft',
        "scheduledAt" TIMESTAMP WITH TIME ZONE,
        "publishedAt" TIMESTAMP WITH TIME ZONE,
        "tags" character varying[],
        "readingTime" integer NOT NULL DEFAULT 1,
        "viewCount" integer NOT NULL DEFAULT 0,
        "likeCount" integer NOT NULL DEFAULT 0,
        "commentCount" integer NOT NULL DEFAULT 0,
        "bookmarkCount" integer NOT NULL DEFAULT 0,
        "isGated" boolean NOT NULL DEFAULT false,
        "tokenPrice" numeric(10,2),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_articles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_articles_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_articles_authorId" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_articles_slug" ON "articles" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_articles_status" ON "articles" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_articles_authorId" ON "articles" ("authorId")`);
    await queryRunner.query(`CREATE INDEX "IDX_articles_publishedAt" ON "articles" ("publishedAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "articles"`);
  }
}
