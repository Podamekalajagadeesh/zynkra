import { MigrationInterface, QueryRunner } from 'typeorm';

export class SecurityAlerts1788100500000 implements MigrationInterface {
  name = 'SecurityAlerts1788100500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "security_alerts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" character varying(64) NOT NULL, "message" text NOT NULL, "severity" character varying(16) NOT NULL DEFAULT 'medium', "resolved" boolean NOT NULL DEFAULT false, "metadata" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_security_alerts_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_security_alerts_user_status_date" ON "security_alerts" ("userId", "resolved", "createdAt")`);
    await queryRunner.query(`ALTER TABLE "security_alerts" ADD CONSTRAINT "FK_security_alerts_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "security_alerts" DROP CONSTRAINT "FK_security_alerts_user"`);
    await queryRunner.query(`DROP INDEX "IDX_security_alerts_user_status_date"`);
    await queryRunner.query(`DROP TABLE "security_alerts"`);
  }
}
