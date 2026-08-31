import { MigrationInterface, QueryRunner } from 'typeorm';

export class BrainwaveDevices1785600000000 implements MigrationInterface {
  name = 'BrainwaveDevices1785600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "brainwave_devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "deviceModel" character varying NOT NULL, "firmware" character varying NOT NULL, "lastUsed" TIMESTAMP WITH TIME ZONE, "accuracy" real NOT NULL DEFAULT 0, "registeredAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_brainwave_devices_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_brainwave_devices_userId" ON "brainwave_devices" ("userId")`);
    await queryRunner.query(`ALTER TABLE "brainwave_devices" ADD CONSTRAINT "FK_brainwave_devices_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "brainwave_devices" DROP CONSTRAINT "FK_brainwave_devices_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_brainwave_devices_userId"`);
    await queryRunner.query(`DROP TABLE "brainwave_devices"`);
  }
}