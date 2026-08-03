import { MigrationInterface, QueryRunner } from 'typeorm';

export class SubscriptionBundles1786953000000 implements MigrationInterface {
  name = 'SubscriptionBundles1786953000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscription_bundles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(120) NOT NULL,
        "description" text,
        "price" numeric(10,2) NOT NULL DEFAULT '0',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "creatorId" uuid,
        CONSTRAINT "PK_subscription_bundles" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "subscription_bundle_tiers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "bundleId" uuid,
        "tierId" uuid,
        CONSTRAINT "PK_subscription_bundle_tiers" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "subscription_bundles" ADD CONSTRAINT "FK_subscription_bundles_creator" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_bundle_tiers" ADD CONSTRAINT "FK_bundle_tiers_bundle" FOREIGN KEY ("bundleId") REFERENCES "subscription_bundles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_bundle_tiers" ADD CONSTRAINT "FK_bundle_tiers_tier" FOREIGN KEY ("tierId") REFERENCES "subscription_tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subscription_bundle_tiers"`);
    await queryRunner.query(`DROP TABLE "subscription_bundles"`);
  }
}
