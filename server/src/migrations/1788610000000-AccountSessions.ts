import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountSessions1788610000000 implements MigrationInterface {
  name = 'AccountSessions1788610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "account_sessions" ("id" character varying(100) NOT NULL, "accountId" uuid NOT NULL, "deviceName" character varying(120) NOT NULL, "ipAddress" character varying(64), "userAgent" text, "isCurrent" boolean NOT NULL DEFAULT false, "status" character varying(16) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_account_sessions_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_account_sessions_account_status" ON "account_sessions" ("accountId", "status")`);
    await queryRunner.query(`ALTER TABLE "account_sessions" ADD CONSTRAINT "FK_account_sessions_account" FOREIGN KEY ("accountId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account_sessions" DROP CONSTRAINT "FK_account_sessions_account"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_account_sessions_account_status"`);
    await queryRunner.query(`DROP TABLE "account_sessions"`);
  }
}
