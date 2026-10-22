import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Persists inbound federated follows.
 *
 * Without this, `processSharedInbox` answered an inbound `Follow` with an
 * `Accept` and then discarded it: no row was written, the relationship never
 * appeared in the local user's followers collection, and `Undo` (Follow) had
 * nothing to remove while still reporting `follow-undo-processed`. The remote
 * server was told the follow existed; we were not storing it.
 */
export class FederationFollows1790000000000 implements MigrationInterface {
  name = 'FederationFollows1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "federation_follows" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "followActivityId" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "localUserId" uuid,
        "remoteUserId" uuid,
        CONSTRAINT "PK_federation_follows" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_federation_follows_pair" UNIQUE ("localUserId", "remoteUserId")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "federation_follows" ADD CONSTRAINT "FK_federation_follows_local_user" FOREIGN KEY ("localUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "federation_follows" ADD CONSTRAINT "FK_federation_follows_remote_user" FOREIGN KEY ("remoteUserId") REFERENCES "federated_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_federation_follows_local_user" ON "federation_follows" ("localUserId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_federation_follows_remote_user" ON "federation_follows" ("remoteUserId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "federation_follows"`);
  }
}
