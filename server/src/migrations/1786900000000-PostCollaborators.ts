import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostCollaborators1786900000000 implements MigrationInterface {
  name = 'PostCollaborators1786900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_collaborators" ("post_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_post_collaborators" PRIMARY KEY ("post_id", "user_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_post_collaborators_post_id" ON "post_collaborators" ("post_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_post_collaborators_user_id" ON "post_collaborators" ("user_id")`);
    await queryRunner.query(
      `ALTER TABLE "post_collaborators" ADD CONSTRAINT "FK_post_collaborators_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_collaborators" ADD CONSTRAINT "FK_post_collaborators_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post_collaborators" DROP CONSTRAINT "FK_post_collaborators_user_id"`);
    await queryRunner.query(`ALTER TABLE "post_collaborators" DROP CONSTRAINT "FK_post_collaborators_post_id"`);
    await queryRunner.query(`DROP TABLE "post_collaborators"`);
  }
}
