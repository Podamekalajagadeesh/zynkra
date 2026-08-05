import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserMutes1788000000000 implements MigrationInterface {
  name = 'UserMutes1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_mutes" (
        "userId" uuid NOT NULL,
        "mutedUserId" uuid NOT NULL,
        CONSTRAINT "PK_user_mutes" PRIMARY KEY ("userId", "mutedUserId")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "user_mutes" ADD CONSTRAINT "FK_user_mutes_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_mutes" ADD CONSTRAINT "FK_user_mutes_muted_user" FOREIGN KEY ("mutedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_mutes_muted_user" ON "user_mutes" ("mutedUserId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_mutes"`);
  }
}
