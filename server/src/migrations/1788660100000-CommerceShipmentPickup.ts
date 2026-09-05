import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommerceShipmentPickup1788660100000 implements MigrationInterface {
  name = 'CommerceShipmentPickup1788660100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "commerce_shipments" ADD "pickupScheduledAt" TIMESTAMP WITH TIME ZONE');
    await queryRunner.query('ALTER TABLE "commerce_shipments" ADD "pickupLocation" text');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "commerce_shipments" DROP COLUMN "pickupLocation"');
    await queryRunner.query('ALTER TABLE "commerce_shipments" DROP COLUMN "pickupScheduledAt"');
  }
}