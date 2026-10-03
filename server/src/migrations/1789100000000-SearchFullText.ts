import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Postgres full-text search vectors + GIN indexes for core search entities.
 * Uses 'simple' dictionary so hashtags/usernames match exactly without stemming.
 * Vectors are kept fresh by AFTER INSERT/UPDATE triggers.
 */
export class SearchFullText1789100000000 implements MigrationInterface {
  name = 'SearchFullText1789100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- users: username + displayName + bio ---
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_searchVector"
      ON "users" USING GIN ("searchVector")
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION users_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW."searchVector" :=
          setweight(to_tsvector('simple', coalesce(NEW."username", '')), 'A') ||
          setweight(to_tsvector('simple', coalesce(NEW."displayName", '')), 'A') ||
          setweight(to_tsvector('simple', coalesce(NEW."bio", '')), 'B');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_users_search_vector ON "users"
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_users_search_vector
      BEFORE INSERT OR UPDATE OF "username", "displayName", "bio" ON "users"
      FOR EACH ROW EXECUTE FUNCTION users_search_vector_update()
    `);
    await queryRunner.query(`
      UPDATE "users" SET "username" = "username" WHERE "searchVector" IS NULL
    `);

    // --- posts: content ---
    await queryRunner.query(`
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_posts_searchVector"
      ON "posts" USING GIN ("searchVector")
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW."searchVector" := to_tsvector('simple', coalesce(NEW."content", ''));
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_posts_search_vector ON "posts"
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_posts_search_vector
      BEFORE INSERT OR UPDATE OF "content" ON "posts"
      FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update()
    `);
    await queryRunner.query(`
      UPDATE "posts" SET "content" = "content" WHERE "searchVector" IS NULL
    `);

    // --- tags: name ---
    await queryRunner.query(`
      ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tags_searchVector"
      ON "tags" USING GIN ("searchVector")
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION tags_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW."searchVector" := to_tsvector('simple', coalesce(NEW."name", ''));
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_tags_search_vector ON "tags"
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_tags_search_vector
      BEFORE INSERT OR UPDATE OF "name" ON "tags"
      FOR EACH ROW EXECUTE FUNCTION tags_search_vector_update()
    `);
    await queryRunner.query(`
      UPDATE "tags" SET "name" = "name" WHERE "searchVector" IS NULL
    `);

    // --- places: name + address ---
    await queryRunner.query(`
      ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_places_searchVector"
      ON "places" USING GIN ("searchVector")
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION places_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW."searchVector" :=
          to_tsvector('simple', coalesce(NEW."name", '') || ' ' || coalesce(NEW."address", ''));
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_places_search_vector ON "places"
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_places_search_vector
      BEFORE INSERT OR UPDATE OF "name", "address" ON "places"
      FOR EACH ROW EXECUTE FUNCTION places_search_vector_update()
    `);
    await queryRunner.query(`
      UPDATE "places" SET "name" = "name" WHERE "searchVector" IS NULL
    `);

    // --- groups: name ---
    await queryRunner.query(`
      ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_groups_searchVector"
      ON "groups" USING GIN ("searchVector")
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION groups_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW."searchVector" := to_tsvector('simple', coalesce(NEW."name", ''));
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_groups_search_vector ON "groups"
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_groups_search_vector
      BEFORE INSERT OR UPDATE OF "name" ON "groups"
      FOR EACH ROW EXECUTE FUNCTION groups_search_vector_update()
    `);
    await queryRunner.query(`
      UPDATE "groups" SET "name" = "name" WHERE "searchVector" IS NULL
    `);

    // --- events: title + description ---
    await queryRunner.query(`
      ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_searchVector"
      ON "event" USING GIN ("searchVector")
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION event_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW."searchVector" :=
          setweight(to_tsvector('simple', coalesce(NEW."title", '')), 'A') ||
          setweight(to_tsvector('simple', coalesce(NEW."description", '')), 'B');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_event_search_vector ON "event"
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_event_search_vector
      BEFORE INSERT OR UPDATE OF "title", "description" ON "event"
      FOR EACH ROW EXECUTE FUNCTION event_search_vector_update()
    `);
    await queryRunner.query(`
      UPDATE "event" SET "title" = "title" WHERE "searchVector" IS NULL
    `);

    // --- products: name + description ---
    await queryRunner.query(`
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_searchVector"
      ON "products" USING GIN ("searchVector")
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW."searchVector" :=
          setweight(to_tsvector('simple', coalesce(NEW."name", '')), 'A') ||
          setweight(to_tsvector('simple', coalesce(NEW."description", '')), 'B');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_products_search_vector ON "products"
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_products_search_vector
      BEFORE INSERT OR UPDATE OF "name", "description" ON "products"
      FOR EACH ROW EXECUTE FUNCTION products_search_vector_update()
    `);
    await queryRunner.query(`
      UPDATE "products" SET "name" = "name" WHERE "searchVector" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      { table: 'users', fn: 'users_search_vector_update', trigger: 'trg_users_search_vector', index: 'IDX_users_searchVector' },
      { table: 'posts', fn: 'posts_search_vector_update', trigger: 'trg_posts_search_vector', index: 'IDX_posts_searchVector' },
      { table: 'tags', fn: 'tags_search_vector_update', trigger: 'trg_tags_search_vector', index: 'IDX_tags_searchVector' },
      { table: 'places', fn: 'places_search_vector_update', trigger: 'trg_places_search_vector', index: 'IDX_places_searchVector' },
      { table: 'groups', fn: 'groups_search_vector_update', trigger: 'trg_groups_search_vector', index: 'IDX_groups_searchVector' },
      { table: 'event', fn: 'event_search_vector_update', trigger: 'trg_event_search_vector', index: 'IDX_event_searchVector' },
      { table: 'products', fn: 'products_search_vector_update', trigger: 'trg_products_search_vector', index: 'IDX_products_searchVector' },
    ];

    for (const { table, fn, trigger, index } of tables) {
      await queryRunner.query(`DROP TRIGGER IF EXISTS "${trigger}" ON "${table}"`);
      await queryRunner.query(`DROP FUNCTION IF EXISTS "${fn}"()`);
      await queryRunner.query(`DROP INDEX IF EXISTS "${index}"`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "searchVector"`);
    }
  }
}
