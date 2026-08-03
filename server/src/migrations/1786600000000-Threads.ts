import { MigrationInterface, QueryRunner } from 'typeorm';

export class Threads1786600000000 implements MigrationInterface {
  name = 'Threads1786600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "threads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "title" character varying(120), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_threads_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_threads_user_id" ON "threads" ("user_id")`);
    await queryRunner.query(
      `ALTER TABLE "threads" ADD CONSTRAINT "FK_threads_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "thread_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "thread_id" uuid NOT NULL, "user_id" uuid NOT NULL, "parent_message_id" uuid, "content" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_thread_messages_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_thread_messages_thread_id" ON "thread_messages" ("thread_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_thread_messages_user_id" ON "thread_messages" ("user_id")`);
    await queryRunner.query(
      `ALTER TABLE "thread_messages" ADD CONSTRAINT "FK_thread_messages_thread_id" FOREIGN KEY ("thread_id") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_messages" ADD CONSTRAINT "FK_thread_messages_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "thread_messages" ADD CONSTRAINT "FK_thread_messages_parent_message_id" FOREIGN KEY ("parent_message_id") REFERENCES "thread_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "thread_messages" DROP CONSTRAINT "FK_thread_messages_parent_message_id"`);
    await queryRunner.query(`ALTER TABLE "thread_messages" DROP CONSTRAINT "FK_thread_messages_user_id"`);
    await queryRunner.query(`ALTER TABLE "thread_messages" DROP CONSTRAINT "FK_thread_messages_thread_id"`);
    await queryRunner.query(`DROP TABLE "thread_messages"`);
    await queryRunner.query(`ALTER TABLE "threads" DROP CONSTRAINT "FK_threads_user_id"`);
    await queryRunner.query(`DROP TABLE "threads"`);
  }
}
