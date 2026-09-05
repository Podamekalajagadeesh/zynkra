import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountHistory1788370000000 implements MigrationInterface {
  name = 'AccountHistory1788370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "account_history" ("id" character varying(80) NOT NULL, "userId" uuid NOT NULL, "type" character varying(32) NOT NULL, "summary" text NOT NULL, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_account_history_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_account_history_user_created" ON "account_history" ("userId", "createdAt")`);
    await queryRunner.query(`ALTER TABLE "account_history" ADD CONSTRAINT "FK_account_history_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account_history" DROP CONSTRAINT "FK_account_history_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_account_history_user_created"`);
    await queryRunner.query(`DROP TABLE "account_history"`);
  }
}
