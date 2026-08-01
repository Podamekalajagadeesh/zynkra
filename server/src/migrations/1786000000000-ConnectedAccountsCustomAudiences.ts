import { MigrationInterface, QueryRunner } from "typeorm";

export class ConnectedAccountsCustomAudiences1786000000000 implements MigrationInterface {
    name = 'ConnectedAccountsCustomAudiences1786000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."connected_accounts_platform_enum" AS ENUM('twitter', 'instagram', 'facebook', 'linkedin', 'tiktok')`);
        await queryRunner.query(`CREATE TABLE "connected_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "platform" "public"."connected_accounts_platform_enum" NOT NULL, "platformUsername" text NOT NULL DEFAULT '', "platformUserId" text NOT NULL DEFAULT '', "apiKey" text, "apiSecret" text, "accessToken" text, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_70416f1da0be645bb31da01c774" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_connected_accounts_userId" ON "connected_accounts" ("userId")`);
        await queryRunner.query(`CREATE TABLE "custom_audiences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "name" character varying(100) NOT NULL, "userIds" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3b4c20104ddae999f450b10adca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_custom_audiences_userId" ON "custom_audiences" ("userId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_custom_audiences_userId"`);
        await queryRunner.query(`DROP TABLE "custom_audiences"`);
        await queryRunner.query(`DROP INDEX "IDX_connected_accounts_userId"`);
        await queryRunner.query(`DROP TABLE "connected_accounts"`);
        await queryRunner.query(`DROP TYPE "public"."connected_accounts_platform_enum"`);
    }
}
