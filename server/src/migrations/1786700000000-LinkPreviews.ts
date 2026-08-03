import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkPreviews1786700000000 implements MigrationInterface {
  name = 'LinkPreviews1786700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "link_previews" ("url" character varying(2048) NOT NULL, "title" character varying(512), "description" character varying(512), "image" character varying(2048), "site_name" character varying(255), "favicon" character varying(2048), "fetched_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_link_previews_url" PRIMARY KEY ("url"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "link_previews"`);
  }
}
