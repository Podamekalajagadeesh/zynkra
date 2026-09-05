import { MigrationInterface, QueryRunner } from 'typeorm';

export class VerificationAppeals1788200000000 implements MigrationInterface {
  name = 'VerificationAppeals1788200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."verification_appeals_status_enum" AS ENUM('pending', 'under_review', 'approved', 'rejected')`);
    await queryRunner.query(`CREATE TABLE "verification_appeals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "requestId" uuid NOT NULL, "reason" text NOT NULL, "documentUrls" jsonb NOT NULL DEFAULT '[]', "links" jsonb NOT NULL DEFAULT '[]', "status" "public"."verification_appeals_status_enum" NOT NULL DEFAULT 'pending', "reviewedAt" TIMESTAMP, "reviewedBy" uuid, "reviewNotes" text, "submittedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_verification_appeals_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_verification_appeals_request_status" ON "verification_appeals" ("requestId", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_verification_appeals_user_submitted" ON "verification_appeals" ("userId", "submittedAt")`);
    await queryRunner.query(`ALTER TABLE "verification_appeals" ADD CONSTRAINT "FK_verification_appeals_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "verification_appeals" ADD CONSTRAINT "FK_verification_appeals_request" FOREIGN KEY ("requestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "verification_appeals" DROP CONSTRAINT "FK_verification_appeals_request"`);
    await queryRunner.query(`ALTER TABLE "verification_appeals" DROP CONSTRAINT "FK_verification_appeals_user"`);
    await queryRunner.query(`DROP INDEX "IDX_verification_appeals_user_submitted"`);
    await queryRunner.query(`DROP INDEX "IDX_verification_appeals_request_status"`);
    await queryRunner.query(`DROP TABLE "verification_appeals"`);
    await queryRunner.query(`DROP TYPE "public"."verification_appeals_status_enum"`);
  }
}
