import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthMagicLinkTrustedSessions1788100000000 implements MigrationInterface {
  name = 'AuthMagicLinkTrustedSessions1788100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "magicLinkTokenHash" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "magicLinkTokenExpiresAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "login_sessions" ADD "isTrusted" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "login_sessions" DROP COLUMN "isTrusted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "magicLinkTokenExpiresAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "magicLinkTokenHash"`,
    );
  }
}
