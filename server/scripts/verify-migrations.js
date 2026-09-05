/**
 * Verifies migrations apply cleanly to a FRESH database, using a throwaway
 * embedded Postgres instance. Run in CI or locally: node scripts/verify-migrations.js
 */
const { default: EmbeddedPostgres } = require('embedded-postgres');
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const net = require('net');

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function main() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zynkra-pg-'));
  const port = await getAvailablePort();
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    port,
    persistent: false,
  });

  console.log('Starting embedded Postgres...');
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('zynkra_verify');

  const env = {
    ...process.env,
    DB_HOST: 'localhost',
    DB_PORT: String(port),
    DB_USERNAME: 'postgres',
    DB_PASSWORD: 'postgres',
    DB_DATABASE: 'zynkra_verify',
  };
  const cwd = path.join(__dirname, '..');

  try {
    console.log('Running migrations against a fresh database...');
    try {
      execSync(
        'npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts',
        { stdio: ['ignore', 'pipe', 'pipe'], cwd, env },
      );
    } catch (e) {
      console.error('migration:run FAILED');
      if (e.stdout) console.error(e.stdout.toString().slice(-4000));
      if (e.stderr) console.error(e.stderr.toString().slice(-2000));
      throw new Error('migration:run failed');
    }

    // A clean schema should produce NO pending changes. If generate finds a
    // diff, an entity was changed without a migration.
    console.log('Checking for schema drift (entities vs migrations)...');
    try {
      execSync(
        'npx typeorm-ts-node-commonjs migration:generate src/migrations/DriftCheck -d src/data-source.ts',
        { stdio: 'pipe', cwd, env },
      );
      // generate SUCCEEDING means it found a diff and wrote a file — that's drift.
      const drift = fs
        .readdirSync(path.join(cwd, 'src/migrations'))
        .filter((f) => f.includes('DriftCheck'));
      drift.forEach((f) => fs.unlinkSync(path.join(cwd, 'src/migrations', f)));
      console.error(
        'FAIL: entities have changes not covered by migrations. Run npm run migration:generate.',
      );
      process.exit(1);
    } catch {
      // generate exits non-zero when there is nothing to migrate — that's the good case.
      console.log('OK: no schema drift. Migrations are in sync with entities.');
    }
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
