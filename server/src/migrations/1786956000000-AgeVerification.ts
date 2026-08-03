import { MigrationInterface, QueryRunner } from 'typeorm';

export class AgeVerification1786956000000 implements MigrationInterface {
  name = 'AgeVerification1786956000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "birthDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "birthDateVerifiedAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "birthDateVerifiedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "birthDate"`);
  }
}
