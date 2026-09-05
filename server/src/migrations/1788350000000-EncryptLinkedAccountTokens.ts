import { MigrationInterface, QueryRunner } from 'typeorm';

export class EncryptLinkedAccountTokens1788350000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "linked_accounts" ADD "encryptedAccessToken" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "linked_accounts" DROP COLUMN "encryptedAccessToken"`);
  }
}
