import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountPreferences1788380000000 implements MigrationInterface {
  name = 'AccountPreferences1788380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "accountPreferences" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "accountPreferences"`);
  }
}