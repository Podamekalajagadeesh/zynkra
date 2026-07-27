import { MigrationInterface, QueryRunner } from 'typeorm';

export class E2eePreKeys1785500000000 implements MigrationInterface {
  name = 'E2eePreKeys1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // One-time pre-keys for the Signal Protocol
    await queryRunner.query(
      `CREATE TABLE "one_time_prekeys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "keyId" integer NOT NULL, "publicKey" text NOT NULL, "isUsed" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_one_time_prekeys_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_otpk_userId" ON "one_time_prekeys" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_otpk_userId_unused" ON "one_time_prekeys" ("userId", "isUsed")`,
    );
    await queryRunner.query(
      `ALTER TABLE "one_time_prekeys" ADD CONSTRAINT "FK_otpk_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Signed pre-keys
    await queryRunner.query(
      `CREATE TABLE "signed_prekeys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "keyId" integer NOT NULL, "publicKey" text NOT NULL, "signature" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_signed_prekeys_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_spk_userId" ON "signed_prekeys" ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "signed_prekeys" ADD CONSTRAINT "FK_spk_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Pre-key bundles for publishing
    await queryRunner.query(
      `CREATE TABLE "prekey_bundles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "registrationId" integer NOT NULL, "deviceId" integer NOT NULL, "identityKey" text NOT NULL, "signedPreKeyPublic" text NOT NULL, "signedPreKeySignature" text NOT NULL, "oneTimePreKeyPublic" text, "oneTimePreKeyId" integer, "signedPreKeyId" integer, "isUsed" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_prekey_bundles_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pkb_userId" ON "prekey_bundles" ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "prekey_bundles" ADD CONSTRAINT "FK_pkb_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Add Signal Protocol fields to users table
    await queryRunner.query(
      `ALTER TABLE "users" ADD "registrationId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "deviceId" integer NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "prekey_bundles" DROP CONSTRAINT "FK_pkb_userId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_pkb_userId"`);
    await queryRunner.query(`DROP TABLE "prekey_bundles"`);

    await queryRunner.query(
      `ALTER TABLE "signed_prekeys" DROP CONSTRAINT "FK_spk_userId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_spk_userId"`);
    await queryRunner.query(`DROP TABLE "signed_prekeys"`);

    await queryRunner.query(
      `ALTER TABLE "one_time_prekeys" DROP CONSTRAINT "FK_otpk_userId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_otpk_userId_unused"`);
    await queryRunner.query(`DROP INDEX "IDX_otpk_userId"`);
    await queryRunner.query(`DROP TABLE "one_time_prekeys"`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deviceId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "registrationId"`);
  }
}
