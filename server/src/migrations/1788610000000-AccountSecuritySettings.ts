import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountSecuritySettings1788610000000 implements MigrationInterface {
  name = 'AccountSecuritySettings1788610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "accountSecuritySettings" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "accountSecuritySettings"`);
  }
}