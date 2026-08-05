import { MigrationInterface, QueryRunner } from 'typeorm';

export class InviteCodes1788000400000 implements MigrationInterface {
  name = 'InviteCodes1788000400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "invite_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(64) NOT NULL,
        "created_by_id" uuid,
        "max_uses" integer NOT NULL DEFAULT 1,
        "uses" integer NOT NULL DEFAULT 0,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invite_codes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "invite_codes" ADD CONSTRAINT "UQ_invite_codes_code" UNIQUE ("code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_codes" ADD CONSTRAINT "FK_invite_codes_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invite_codes_code" ON "invite_codes" ("code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "invite_codes"`);
  }
}
