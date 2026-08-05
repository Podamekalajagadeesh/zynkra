import { MigrationInterface, QueryRunner } from 'typeorm';

export class PayoutDueAt1788000200000 implements MigrationInterface {
  name = 'PayoutDueAt1788000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD "dueAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payouts" DROP COLUMN "dueAt"`);
  }
}
