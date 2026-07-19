// One-off audit: files unreachable from the app entry point (src/main.tsx).
// Resolves relative imports only; bare-specifier (npm) imports are ignored.
const fs = require('fs');
const path = require('path');

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name).split(path.sep).join('/');
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx|css)$/.test(e.name)) files.push(p);
  }
})('src');
const fileSet = new Set(files);

const EXTS = ['.ts', '.tsx', '.js', '.jsx', '.css'];
function resolve(fromFile, spec) {
  let base;
  if (spec.startsWith('@/')) base = 'src/' + spec.slice(2); // vite "@" alias
  else if (spec.startsWith('.')) base = path.posix.join(path.posix.dirname(fromFile), spec);
  else return null; // bare specifier = npm package
  const candidates = [base, ...EXTS.map((e) => base + e), ...EXTS.map((e) => base + '/index' + e)];
  for (const c of candidates) if (fileSet.has(c)) return c;
  return null;
}

const importRe = /(?:from\s+|import\s+|import\(|require\()['"]([^'"]+)['"]/g;
const graph = new Map();
for (const f of files) {
  if (f.endsWith('.css')) { graph.set(f, []); continue; }
  const src = fs.readFileSync(f, 'utf8');
  const deps = [];
  let m;
  while ((m = importRe.exec(src))) {
    const r = resolve(f, m[1]);
    if (r) deps.push(r);
  }
  graph.set(f, deps);
}

// Roots: entry point + external consumers (scripts/, service worker in public/)
const roots = ['src/main.tsx'];
for (const s of fs.readdirSync('scripts')) {
  if (!/\.(mjs|cjs|js)$/.test(s)) continue;
  const src = fs.readFileSync('scripts/' + s, 'utf8');
  let m;
  const re = /(?:from\s+|import\(|require\()['"]([^'"]+)['"]/g;
  while ((m = re.exec(src))) {
    const r = resolve('scripts/' + s, m[1]);
    if (r) roots.push(r);
  }
}

const reachable = new Set();
const stack = [...roots];
while (stack.length) {
  const f = stack.pop();
  if (reachable.has(f)) continue;
  reachable.add(f);
  for (const d of graph.get(f) || []) stack.push(d);
}

// Tests are reachable iff their subject is; report them alongside.
const dead = files.filter((f) => !reachable.has(f) && !/\.d\.ts$/.test(f));
const deadTests = dead.filter((f) => /\.(test|spec)\./.test(f));
const deadSrc = dead.filter((f) => !/\.(test|spec)\./.test(f));
console.log('--- unreachable source files ---');
console.log(deadSrc.join('\n'));
console.log('--- unreachable test files ---');
console.log(deadTests.join('\n'));
console.log(`TOTAL: ${deadSrc.length} src + ${deadTests.length} tests of ${files.length}`);
