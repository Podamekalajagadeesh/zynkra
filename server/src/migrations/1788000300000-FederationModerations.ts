import { MigrationInterface, QueryRunner } from 'typeorm';

export class FederationModerations1788000300000 implements MigrationInterface {
  name = 'FederationModerations1788000300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "federation_moderations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "isBlocked" boolean NOT NULL DEFAULT false,
        "isMuted" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "localUserId" uuid,
        "remoteUserId" uuid,
        CONSTRAINT "PK_federation_moderations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_federation_moderations_pair" UNIQUE ("localUserId", "remoteUserId")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "federation_moderations" ADD CONSTRAINT "FK_federation_moderations_local_user" FOREIGN KEY ("localUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "federation_moderations" ADD CONSTRAINT "FK_federation_moderations_remote_user" FOREIGN KEY ("remoteUserId") REFERENCES "federated_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_federation_moderations_local_user" ON "federation_moderations" ("localUserId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_federation_moderations_remote_user" ON "federation_moderations" ("remoteUserId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "federation_moderations"`);
  }
}
