const fs = require('fs');
const { Client } = require('pg');

const src = fs.readFileSync('src/users/entities/user.entity.ts', 'utf8');
const names = [...src.matchAll(/@Column\s*(?:\([\s\S]*?\))?\s*\n\s*([A-Za-z0-9_]+)\s*:/g)].map(m => m[1]);
const names2 = [...src.matchAll(/@Column\s*\(\s*\(\)\s*=>\s*([A-Za-z0-9_]+)\s*\)\s*\)\s*\n\s*([A-Za-z0-9_]+)\s*:/g)].map(m => m[2]);
const set = new Set([...names, ...names2]);
(async () => {
  const c = new Client({ host: '127.0.0.1', port: 15432, user: 'postgres', password: 'postgres', database: 'zynkra' });
  await c.connect();
  const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY column_name");
  const db = new Set(r.rows.map(x => x.column_name));
  const missing = [...set].filter(name => !db.has(name));
  console.log(JSON.stringify({ entityCount: set.size, dbCount: db.size, missingCount: missing.length, missing }, null, 2));
  await c.end();
})();
