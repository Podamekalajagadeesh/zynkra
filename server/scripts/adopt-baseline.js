/**
 * Adopts an EXISTING database (created under synchronize: true) into the
 * migrations workflow: marks the baseline migration as already applied
 * without running it. Run ONCE per pre-existing database.
 *
 * Usage: node scripts/adopt-baseline.js
 */
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const migrationsDir = path.join(__dirname, '..', 'src', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))
    .sort();
  if (files.length === 0) {
    console.error('No migrations found in src/migrations.');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'zynkra',
  });
  await client.connect();

  try {
    // Refuse to adopt an empty database — there, migrations should actually run.
    const { rows } = await client.query(
      `SELECT count(*)::int AS n FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'user'`,
    );
    if (rows[0].n === 0) {
      console.error(
        'This looks like a fresh database (no "user" table). Just start the app — migrations run automatically.',
      );
      process.exit(1);
    }

    await client.query(
      `CREATE TABLE IF NOT EXISTS "migrations" (
        "id" SERIAL PRIMARY KEY,
        "timestamp" bigint NOT NULL,
        "name" character varying NOT NULL
      )`,
    );

    for (const file of files) {
      // 1784458210376-Baseline.ts -> timestamp 1784458210376, class Baseline1784458210376
      const m = file.match(/^(\d+)-(.+)\.ts$/);
      if (!m) continue;
      const [, timestamp, label] = m;
      const name = `${label}${timestamp}`;
      const existing = await client.query(
        'SELECT 1 FROM "migrations" WHERE "name" = $1',
        [name],
      );
      if (existing.rowCount > 0) {
        console.log(`Already marked: ${name}`);
        continue;
      }
      await client.query(
        'INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)',
        [timestamp, name],
      );
      console.log(`Marked as applied: ${name}`);
    }
    console.log('Done. This database is now on the migrations workflow.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
