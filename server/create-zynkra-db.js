const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: '127.0.0.1',
    port: 15432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  await client.connect();

  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', ['zynkra']);

  if (exists.rowCount === 0) {
    await client.query('CREATE DATABASE "zynkra"');
    console.log('CREATED_DATABASE_ZYNKRA');
  } else {
    console.log('DATABASE_ZYNKRA_ALREADY_EXISTS');
  }

  await client.end();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
