import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountDataPermissions1788600100000 implements MigrationInterface {
  name = 'AccountDataPermissions1788600100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "accountDataPermissions" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "accountDataPermissions"`);
  }
}