const { Client } = require('pg');
(async () => {
  const c = new Client({ host: '127.0.0.1', port: 15432, user: 'postgres', password: 'postgres', database: 'zynkra' });
  await c.connect();
  const m = await c.query("SELECT * FROM migrations ORDER BY id");
  console.log('MIGRATIONS');
  console.log(JSON.stringify(m.rows, null, 2));
  const u = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY column_name");
  console.log('COLS');
  console.log(u.rows.map(r => r.column_name).join('\n'));
  await c.end();
})().catch(err => { console.error(err); process.exit(1); });
