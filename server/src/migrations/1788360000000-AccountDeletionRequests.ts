import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountDeletionRequests1788360000000 implements MigrationInterface {
  name = 'AccountDeletionRequests1788360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "account_deletion_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "reason" character varying(40) NOT NULL, "additionalInfo" character varying(500), "deleteLinkedAccounts" boolean NOT NULL DEFAULT true, "deleteAllData" boolean NOT NULL DEFAULT true, "status" character varying(20) NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "processedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_account_deletion_requests_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_account_deletion_requests_account_status" ON "account_deletion_requests" ("accountId", "status")`);
    await queryRunner.query(`ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "FK_account_deletion_requests_account" FOREIGN KEY ("accountId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account_deletion_requests" DROP CONSTRAINT "FK_account_deletion_requests_account"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_account_deletion_requests_account_status"`);
    await queryRunner.query(`DROP TABLE "account_deletion_requests"`);
  }
}