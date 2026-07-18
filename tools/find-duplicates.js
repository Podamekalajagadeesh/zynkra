const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const exts = new Set(['.ts','.tsx','.js','.jsx','.json','.css','.html','.md']);
const ignoreDirs = new Set(['node_modules','dist','.git','build']);

function walk(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ignoreDirs.has(ent.name)) continue;
      results = results.concat(walk(full));
    } else if (ent.isFile()) {
      if (!exts.has(path.extname(ent.name))) continue;
      results.push(full);
    }
  }
  return results;
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

try {
  const files = walk(root);
  const map = new Map();
  for (const f of files) {
    try {
      const content = fs.readFileSync(f);
      const h = sha256(content);
      if (!map.has(h)) map.set(h, []);
      map.get(h).push(path.relative(root, f).replace(/\\/g,'/'));
    } catch (e) {
      console.error('skip', f, e.message);
    }
  }

  const groups = Array.from(map.values()).filter(g => g.length > 1);
  if (groups.length === 0) {
    console.log('No exact duplicate files found.');
    process.exit(0);
  }

  console.log('Exact duplicate file groups (byte-for-byte):\n');
  groups.forEach((g, i) => {
    console.log(`Group ${i+1}:`);
    g.forEach(p => console.log('  -', p));
    console.log('');
  });
  console.log(`Found ${groups.length} duplicate groups.`);
} catch (err) {
  console.error('Error during scan:', err.message);
  process.exit(2);
}
