import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Dead-letter queue for outbound federation deliveries.
 *
 * A delivery that exhausts its in-request retries used to be reported in a
 * `FederationReport` and then forgotten — nothing retained the activity, so
 * nothing could redrive it automatically when the peer came back. This table
 * retains the failed delivery (payload verbatim) and its retry schedule.
 */
export class FederationDeliveryAttempts1793000000000 implements MigrationInterface {
  name = 'FederationDeliveryAttempts1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "federation_delivery_attempts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "activityId" character varying NOT NULL,
        "activityType" character varying(32) NOT NULL,
        "payload" text NOT NULL,
        "inboxUrl" character varying NOT NULL,
        "instanceDomain" character varying NOT NULL,
        "actorUsername" character varying,
        "attempts" integer NOT NULL DEFAULT 1,
        "lastStatus" integer,
        "lastReason" text,
        "retryable" boolean NOT NULL DEFAULT true,
        "dead" boolean NOT NULL DEFAULT false,
        "nextRetryAt" TIMESTAMP WITH TIME ZONE,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_federation_delivery_attempts" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_federation_delivery_pending" ON "federation_delivery_attempts" ("dead", "completedAt", "nextRetryAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_federation_delivery_activity" ON "federation_delivery_attempts" ("activityId", "inboxUrl")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "federation_delivery_attempts"`);
  }
}
