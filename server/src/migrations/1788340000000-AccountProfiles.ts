import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountProfiles1788340000000 implements MigrationInterface {
  name = 'AccountProfiles1788340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."account_profiles_accounttype_enum" AS ENUM('personal', 'creator', 'business', 'organization')`);
    await queryRunner.query(`CREATE TABLE "account_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "label" character varying(80) NOT NULL, "accountType" "public"."account_profiles_accounttype_enum" NOT NULL DEFAULT 'personal', "isPrimary" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_account_profiles_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_account_profiles_account_primary" ON "account_profiles" ("accountId", "isPrimary")`);
    await queryRunner.query(`ALTER TABLE "account_profiles" ADD CONSTRAINT "FK_account_profiles_account" FOREIGN KEY ("accountId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account_profiles" DROP CONSTRAINT "FK_account_profiles_account"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_account_profiles_account_primary"`);
    await queryRunner.query(`DROP TABLE "account_profiles"`);
    await queryRunner.query(`DROP TYPE "public"."account_profiles_accounttype_enum"`);
  }
}
