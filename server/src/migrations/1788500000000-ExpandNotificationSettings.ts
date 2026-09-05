import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandNotificationSettings1788500000000 implements MigrationInterface {
  name = 'ExpandNotificationSettings1788500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD "notificationSettingsEmaildigest" boolean NOT NULL DEFAULT true');
    await queryRunner.query('ALTER TABLE "users" ADD "notificationSettingsPushalerts" boolean NOT NULL DEFAULT true');
    await queryRunner.query('ALTER TABLE "users" ADD "notificationSettingsSmsalerts" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TABLE "users" ADD "notificationSettingsSecurityalerts" boolean NOT NULL DEFAULT true');
    await queryRunner.query('ALTER TABLE "users" ADD "notificationSettingsNotifymentions" boolean NOT NULL DEFAULT true');
    await queryRunner.query('ALTER TABLE "users" ADD "notificationSettingsCustomnotifications" jsonb NOT NULL DEFAULT \'{}\'');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "notificationSettingsCustomnotifications"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "notificationSettingsNotifymentions"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "notificationSettingsSecurityalerts"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "notificationSettingsSmsalerts"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "notificationSettingsPushalerts"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "notificationSettingsEmaildigest"');
  }
}