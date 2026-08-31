import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationMessagePreference1788100100000 implements MigrationInterface {
  name = 'NotificationMessagePreference1788100100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "notificationSettingsMessages" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "notificationSettingsMessages"`,
    );
  }
}
