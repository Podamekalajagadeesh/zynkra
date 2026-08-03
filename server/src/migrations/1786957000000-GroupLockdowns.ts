import { MigrationInterface, QueryRunner } from 'typeorm';

export class GroupLockdowns1786957000000 implements MigrationInterface {
  name = 'GroupLockdowns1786957000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Raid detection needs a join timestamp on memberships.
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE TYPE "group_lockdowns_mode_enum" AS ENUM ('approval', 'mute_new', 'full')`,
    );
    await queryRunner.query(`
      CREATE TABLE "group_lockdowns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mode" "group_lockdowns_mode_enum" NOT NULL DEFAULT 'approval',
        "activeSince" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "activeUntil" TIMESTAMP WITH TIME ZONE,
        "newMemberMuteHours" integer NOT NULL DEFAULT 24,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "groupId" uuid,
        "createdById" uuid,
        CONSTRAINT "PK_group_lockdowns" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "group_lockdowns" ADD CONSTRAINT "FK_group_lockdowns_group" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_lockdowns" ADD CONSTRAINT "FK_group_lockdowns_creator" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "group_lockdowns"`);
    await queryRunner.query(`DROP TYPE "group_lockdowns_mode_enum"`);
    await queryRunner.query(`ALTER TABLE "group_members" DROP COLUMN "createdAt"`);
  }
}
