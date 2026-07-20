import { MigrationInterface, QueryRunner } from 'typeorm';

export class VoiceNotes1784960000000 implements MigrationInterface {
  name = 'VoiceNotes1784960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "message" ADD "voiceNote" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "voiceNote"`);
  }
}
