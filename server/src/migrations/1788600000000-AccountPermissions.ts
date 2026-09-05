import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountPermissions1788600000000 implements MigrationInterface {
  name = 'AccountPermissions1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "accountPermissions" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "accountPermissions"`);
  }
}