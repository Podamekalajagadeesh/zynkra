import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Records activities this instance has sent to peers.
 *
 * Without this there is no way to build a correct `Delete` or `Undo`: both must
 * reference the id of the activity the peer actually received. The previous
 * bookkeeping attempt wrote those ids into `federated_posts` (an inbound-content
 * table) and wrote the *activity* id while the lookup read the *Note* id, so
 * `federateDelete` always found nothing and never emitted a Delete.
 */
export class FederationOutbox1790100000000 implements MigrationInterface {
  name = 'FederationOutbox1790100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "federation_outbox" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "activityId" character varying NOT NULL,
        "objectId" character varying,
        "activityType" character varying(32) NOT NULL,
        "deliveredTo" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "localUserId" uuid,
        CONSTRAINT "PK_federation_outbox" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_federation_outbox_activity" UNIQUE ("activityId")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "federation_outbox" ADD CONSTRAINT "FK_federation_outbox_local_user" FOREIGN KEY ("localUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_federation_outbox_local_user" ON "federation_outbox" ("localUserId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_federation_outbox_object" ON "federation_outbox" ("objectId", "activityType")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "federation_outbox"`);
  }
}
