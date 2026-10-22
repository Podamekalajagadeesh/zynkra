import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * E2EE DM attachments (Phase 3): marks media rows whose stored bytes are
 * client-side ciphertext. The server skips metadata/thumbnail derivation
 * for these blobs and never has the keys to read them.
 */
export class MediaIsEncrypted1792500000000 implements MigrationInterface {
  name = 'MediaIsEncrypted1792500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "media"
      ADD COLUMN "isEncrypted" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "media"
      DROP COLUMN "isEncrypted"
    `);
  }
}
