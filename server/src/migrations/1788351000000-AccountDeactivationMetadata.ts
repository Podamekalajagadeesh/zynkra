import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountDeactivationMetadata1788351000000 implements MigrationInterface {
  name = 'AccountDeactivationMetadata1788351000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD "deactivatedAt" TIMESTAMP WITH TIME ZONE');
    await queryRunner.query('ALTER TABLE "users" ADD "deactivationReason" character varying(500)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "deactivationReason"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "deactivatedAt"');
  }
}
