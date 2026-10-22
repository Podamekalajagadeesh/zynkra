import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Scheduled exports + archive bookkeeping.
 *
 * - `export_schedule`: per-user opt-in for automatic periodic archives
 *   (Wave 5's "scheduled/automated exports").
 * - `data_export.origin`: distinguishes cron-generated archives from
 *   user-triggered ones (history display + retention decisions).
 * - `data_export.sizeBytes`: archive size shown in the history list.
 */
export class ExportScheduleAndRetention1793200000000 implements MigrationInterface {
  name = 'ExportScheduleAndRetention1793200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "export_schedule" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "enabled" boolean NOT NULL DEFAULT false,
        "intervalDays" integer NOT NULL DEFAULT 30,
        "lastExportAt" TIMESTAMP,
        "nextExportAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_export_schedule" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_export_schedule_user" UNIQUE ("userId")
      )
    `);
    // FK name matches TypeORM's deterministic naming strategy so this
    // migration leaves zero entity-vs-schema drift behind.
    await queryRunner.query(
      `ALTER TABLE "export_schedule" ADD CONSTRAINT "FK_01eb189492b55bea44a08b7cda9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "data_export" ADD COLUMN "origin" character varying(16) NOT NULL DEFAULT 'manual'`
    );
    await queryRunner.query(`ALTER TABLE "data_export" ADD COLUMN "sizeBytes" bigint`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "export_schedule"`);
    await queryRunner.query(`ALTER TABLE "data_export" DROP COLUMN "sizeBytes"`);
    await queryRunner.query(`ALTER TABLE "data_export" DROP COLUMN "origin"`);
  }
}
