import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Audit trail for E2EE key rotation.
 *
 * Peers need a way to detect that an identity key or signed pre-key changed
 * under an existing session; without a recorded event there is nothing to poll
 * and rotation is invisible until a session breaks.
 */
export class KeyRotationEvents1793100000000 implements MigrationInterface {
  name = 'KeyRotationEvents1793100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "key_rotation_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "kind" character varying(32) NOT NULL,
        "keyId" integer,
        "detail" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_key_rotation_events" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "key_rotation_events" ADD CONSTRAINT "FK_key_rotation_events_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_key_rotation_user_kind" ON "key_rotation_events" ("userId", "kind", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "key_rotation_events"`);
  }
}
