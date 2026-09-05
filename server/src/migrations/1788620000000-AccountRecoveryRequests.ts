import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountRecoveryRequests1788620000000 implements MigrationInterface {
  name = 'AccountRecoveryRequests1788620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "account_recovery_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "method" character varying(32) NOT NULL, "status" character varying(16) NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_account_recovery_requests_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_account_recovery_account_created" ON "account_recovery_requests" ("accountId", "createdAt")`);
    await queryRunner.query(`ALTER TABLE "account_recovery_requests" ADD CONSTRAINT "FK_account_recovery_account" FOREIGN KEY ("accountId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account_recovery_requests" DROP CONSTRAINT "FK_account_recovery_account"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_account_recovery_account_created"`);
    await queryRunner.query(`DROP TABLE "account_recovery_requests"`);
  }
}
