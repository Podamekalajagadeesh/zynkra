import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoryPollVotes1793401000000 implements MigrationInterface {
  name = 'StoryPollVotes1793401000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "story_poll_votes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "optionIndex" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "elementId" uuid, CONSTRAINT "PK_6f8150456d7345db0fee681418d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_story_poll_votes_elementId" ON "story_poll_votes" ("elementId") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_story_poll_votes_element_user" ON "story_poll_votes" ("elementId", "userId") `
    );
    await queryRunner.query(
      `ALTER TABLE "story_poll_votes" ADD CONSTRAINT "FK_9588d5e168e015a277314ec2e93" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "story_poll_votes" ADD CONSTRAINT "FK_7deb2e27ede1663ee8d3e508100" FOREIGN KEY ("elementId") REFERENCES "story_elements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "story_poll_votes" DROP CONSTRAINT "FK_7deb2e27ede1663ee8d3e508100"`
    );
    await queryRunner.query(
      `ALTER TABLE "story_poll_votes" DROP CONSTRAINT "FK_9588d5e168e015a277314ec2e93"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_story_poll_votes_element_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_story_poll_votes_elementId"`);
    await queryRunner.query(`DROP TABLE "story_poll_votes"`);
  }
}
