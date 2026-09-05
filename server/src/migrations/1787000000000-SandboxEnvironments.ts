import { MigrationInterface, QueryRunner } from 'typeorm';

export class SandboxEnvironments1787000000000 implements MigrationInterface {
  name = 'SandboxEnvironments1787000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."sandbox_environments_status_enum" AS ENUM('active', 'suspended', 'archived')`);
    await queryRunner.query(`CREATE TABLE "sandbox_environments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "slug" character varying(140) NOT NULL, "accessKeyHash" character varying(96) NOT NULL, "status" "public"."sandbox_environments_status_enum" NOT NULL DEFAULT 'active', "configuration" jsonb NOT NULL DEFAULT '{}', "expiresAt" TIMESTAMP WITH TIME ZONE, "lastUsedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_sandbox_environments_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_sandbox_environments_slug" ON "sandbox_environments" ("slug")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_sandbox_environments_accessKeyHash" ON "sandbox_environments" ("accessKeyHash")`);
    await queryRunner.query(`CREATE INDEX "IDX_sandbox_environments_status" ON "sandbox_environments" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_sandbox_environments_expiresAt" ON "sandbox_environments" ("expiresAt")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_sandbox_environments_expiresAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sandbox_environments_status"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_sandbox_environments_accessKeyHash"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_sandbox_environments_slug"`);
    await queryRunner.query(`DROP TABLE "sandbox_environments"`);
    await queryRunner.query(`DROP TYPE "public"."sandbox_environments_status_enum"`);
  }
}