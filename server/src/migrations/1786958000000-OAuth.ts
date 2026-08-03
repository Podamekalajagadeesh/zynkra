import { MigrationInterface, QueryRunner } from 'typeorm';

export class OAuth1786958000000 implements MigrationInterface {
  name = 'OAuth1786958000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "oauth_apps" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(120) NOT NULL,
        "description" text,
        "clientId" character varying NOT NULL,
        "clientSecretHash" character varying NOT NULL,
        "redirectUris" jsonb NOT NULL DEFAULT '[]',
        "scopes" jsonb NOT NULL DEFAULT '["read_profile"]',
        "homepageUrl" character varying(254),
        "isPublic" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "developerId" uuid,
        CONSTRAINT "PK_oauth_apps" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_oauth_apps_clientId" UNIQUE ("clientId")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "oauth_authorizations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "scopes" jsonb NOT NULL DEFAULT '[]',
        "codeHash" character varying,
        "codeExpiresAt" TIMESTAMP WITH TIME ZONE,
        "codeChallenge" character varying,
        "codeChallengeMethod" character varying(10) NOT NULL DEFAULT 'S256',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "appId" uuid,
        "userId" uuid,
        CONSTRAINT "PK_oauth_authorizations" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "oauth_apps" ADD CONSTRAINT "FK_oauth_apps_developer" FOREIGN KEY ("developerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_authorizations" ADD CONSTRAINT "FK_oauth_auth_app" FOREIGN KEY ("appId") REFERENCES "oauth_apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_authorizations" ADD CONSTRAINT "FK_oauth_auth_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oauth_auth_codeHash" ON "oauth_authorizations" ("codeHash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oauth_auth_app" ON "oauth_authorizations" ("appId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "oauth_authorizations"`);
    await queryRunner.query(`DROP TABLE "oauth_apps"`);
  }
}
