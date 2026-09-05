import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserContactPhone1788710000000 implements MigrationInterface {
  name = 'UserContactPhone1788710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneNumber" character varying(32) UNIQUE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "phoneNumber"`);
  }
}
