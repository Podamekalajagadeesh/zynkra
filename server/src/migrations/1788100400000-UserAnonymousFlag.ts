import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserAnonymousFlag1788100400000 implements MigrationInterface {
  name = 'UserAnonymousFlag1788100400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isAnonymous" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "isAnonymous"`);
  }
}
