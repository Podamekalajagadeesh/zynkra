import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inbound engagement for LOCAL posts (Batch 3).
 *
 * Two storage gaps stood between an inbound Like/Announce and a counter that
 * tells the truth:
 *
 * 1. `post_reactions` had no way to attribute a row to a remote actor, so an
 *    inbound Like was dropped. The nullable `remoteActorUrl` column lets a
 *    remote liker own a row with `userId = NULL` — which is exactly what the
 *    API already serves (`likes` is `reactions.length`, and the client only
 *    reads `reaction`, never `reaction.user`). The partial unique index is the
 *    idempotency guarantee: re-delivered activities cannot double-count.
 * 2. Boosts only touch the `posts.shareCount` column, so an Undo had no row to
 *    remove and could decrement a counter it never incremented.
 *    `federation_reshares` is that row: one per (post, remote actor), created
 *    when we increment, removed when we decrement.
 */
export class FederationInboundEngagement1794000000000 implements MigrationInterface {
  name = 'FederationInboundEngagement1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_reactions" ADD COLUMN "remoteActorUrl" character varying`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_post_reactions_remote_actor" ON "post_reactions" ("postId", "remoteActorUrl", "reaction") WHERE "remoteActorUrl" IS NOT NULL`
    );
    await queryRunner.query(
      `CREATE TABLE "federation_reshares" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "activityId" character varying, "localPostId" uuid NOT NULL, "remoteActorUrl" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_federation_reshares" PRIMARY KEY ("id"), CONSTRAINT "UQ_federation_reshares_target" UNIQUE ("localPostId", "remoteActorUrl"))`
    );
    await queryRunner.query(
      `ALTER TABLE "federation_reshares" ADD CONSTRAINT "FK_federation_reshares_post" FOREIGN KEY ("localPostId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "federation_reshares" DROP CONSTRAINT "FK_federation_reshares_post"`
    );
    await queryRunner.query(`DROP TABLE "federation_reshares"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_post_reactions_remote_actor"`);
    await queryRunner.query(`ALTER TABLE "post_reactions" DROP COLUMN "remoteActorUrl"`);
  }
}
