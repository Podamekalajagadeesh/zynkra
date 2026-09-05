import { MigrationInterface, QueryRunner } from 'typeorm';

export class ActiveAccountProfile1788630000000 implements MigrationInterface {
  name = 'ActiveAccountProfile1788630000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD "activeAccountProfileId" uuid');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "activeAccountProfileId"');
  }
}