/**
 * Generates a TypeORM migration against a throwaway embedded Postgres
 * instance (no local Postgres required). Existing migrations are applied
 * first, so the generated file contains only the diff since the last one.
 *
 * Usage: node scripts/generate-migration.js [MigrationName]
 */
const { default: EmbeddedPostgres } = require('embedded-postgres');
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

async function main() {
  const name = process.argv[2] || 'Migration';
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zynkra-pg-'));
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    port: 55432,
    persistent: false,
  });

  console.log('Starting embedded Postgres...');
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('zynkra_migration');

  const cwd = path.join(__dirname, '..');
  const env = {
    ...process.env,
    DB_HOST: 'localhost',
    DB_PORT: '55432',
    DB_USERNAME: 'postgres',
    DB_PASSWORD: 'postgres',
    DB_DATABASE: 'zynkra_migration',
  };

  try {
    const hasMigrations =
      fs.existsSync(path.join(cwd, 'src/migrations')) &&
      fs.readdirSync(path.join(cwd, 'src/migrations')).some((f) => f.endsWith('.ts'));
    if (hasMigrations) {
      console.log('Applying existing migrations...');
      execSync(
        'npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts',
        { stdio: 'inherit', cwd, env },
      );
    }

    console.log('Generating migration...');
    execSync(
      `npx typeorm-ts-node-commonjs migration:generate src/migrations/${name} -d src/data-source.ts`,
      { stdio: 'inherit', cwd, env },
    );
  } finally {
    console.log('Stopping embedded Postgres...');
    await pg.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
