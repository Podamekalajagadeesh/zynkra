import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserReadReceipts1788100200000 implements MigrationInterface {
  name = 'UserReadReceipts1788100200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "readReceipts" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "readReceipts"`);
  }
}
