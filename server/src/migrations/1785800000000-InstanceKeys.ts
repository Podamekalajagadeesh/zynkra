import { MigrationInterface, QueryRunner } from 'typeorm';

export class InstanceKeys1785800000000 implements MigrationInterface {
  name = 'InstanceKeys1785800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "instance_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "privateKey" text NOT NULL, "publicKey" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_instance_keys_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "instance_keys"`);
  }
}
