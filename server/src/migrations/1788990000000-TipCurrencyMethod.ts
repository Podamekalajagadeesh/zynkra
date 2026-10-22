import { MigrationInterface, QueryRunner } from 'typeorm';

export class TipCurrencyMethod1788990000000 implements MigrationInterface {
  name = 'TipCurrencyMethod1788990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tip" ADD "currency" character varying NOT NULL DEFAULT 'usd'`
    );
    await queryRunner.query(`ALTER TABLE "tip" ADD "method" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tip" DROP COLUMN "method"`);
    await queryRunner.query(`ALTER TABLE "tip" DROP COLUMN "currency"`);
  }
}
