import { MigrationInterface, QueryRunner } from 'typeorm';

export class PersonalizationControls1788100400000 implements MigrationInterface {
  name = 'PersonalizationControls1788100400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "personalizationControls" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "personalizationControls"`,
    );
  }
}