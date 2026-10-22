#!/usr/bin/env node
/**
 * Static security regression checks for the Zynkra server.
 *
 * HISTORY: this file used to be an `fs.walk` plus two substring greps for
 * `eval(` and `process.env.SECRET`. It could not fail — it always exited 0 even
 * with findings, and neither rule could ever match anything real. It was run as
 * the `security-audit` CI job, so that job was a green tick that meant nothing.
 * (ROADMAP.md §8 item 9.)
 *
 * This is NOT a vulnerability scanner and NOT a substitute for `npm audit` or a
 * human review. It is a regression guard for the specific mistakes this codebase
 * has actually made. Deliberately few, high-confidence rules: a check that fires
 * on correct code is worse than no check, because it trains people to ignore it.
 *
 * Usage:
 *   node scripts/security-audit.js           # human-readable; exit 1 on findings
 *   node scripts/security-audit.js --json    # machine-readable
 */

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const findings = [];

function report(rule, relFile, line, detail) {
  findings.push({ rule, file: relFile, line, detail });
}

function read(rel) {
  const p = path.join(REPO_ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

/** 1-based line numbers in `content` matching `pattern`. */
function lineNumbersOf(content, pattern) {
  const hits = [];
  content.split('\n').forEach((text, i) => {
    // Reset lastIndex so a /g pattern is safe to reuse.
    pattern.lastIndex = 0;
    if (pattern.test(text)) hits.push(i + 1);
  });
  return hits;
}

const serverSrc = path.join(REPO_ROOT, 'src');
const walk = (dir) => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'archive')
      continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|js)$/.test(entry.name)) out.push(full);
  }
  return out;
};

// --- 1. TypeORM `synchronize` must stay off ---------------------------------
// With 140+ entities it silently drops and alters columns, destroying data.
for (const rel of ['src/app.module.ts', 'src/data-source.ts']) {
  const content = read(rel);
  if (!content) continue;
  for (const line of lineNumbersOf(content, /synchronize\s*:\s*true/)) {
    report(
      'typeorm-synchronize-enabled',
      rel,
      line,
      'synchronize: true must never be enabled — it will drop/alter columns. See the comment in app.module.ts.'
    );
  }
}

// --- 2. No hardcoded JWT/session signing secret -----------------------------
// A literal secret defeats every token signature check in the app.
for (const rel of ['src/auth/strategies/jwt.strategy.ts', 'src/main.ts']) {
  const content = read(rel);
  if (!content) continue;
  for (const line of lineNumbersOf(content, /(secret|secretOrKey)\s*:\s*['"][^'"]{6,}['"]/)) {
    report(
      'hardcoded-signing-secret',
      rel,
      line,
      'A JWT/session signing secret appears to be a string literal. Read it from config instead.'
    );
  }
}

// --- 3. `trust proxy` must not be the boolean `true` ------------------------
// `true` means "believe any X-Forwarded-For from any peer", which is spoofable.
for (const rel of ['src/main.ts', 'src/app.module.ts']) {
  const content = read(rel);
  if (!content) continue;
  for (const line of lineNumbersOf(content, /['"]?trust proxy['"]?\s*[,:=]\s*true\b/)) {
    report(
      'trust-proxy-true',
      rel,
      line,
      'trust proxy must be a hop count (e.g. 1), not `true` — `true` lets clients forge their IP.'
    );
  }
}

// --- 4. Security nonces must not use Math.random() -------------------------
// Only files whose job is generating a nonce/challenge. The CAPTCHA puzzle is
// deliberately excluded: its answer is returned to the client, so it is an
// anti-bot speed bump, not a secret.
for (const rel of [
  'src/siwe/siwe.controller.ts',
  'src/wallet/wallet.controller.ts',
  'src/auth/webauthn.service.ts',
]) {
  const content = read(rel);
  if (!content) continue;
  for (const line of lineNumbersOf(content, /Math\.random\(\)/)) {
    report(
      'insecure-randomness',
      rel,
      line,
      'Math.random() is not cryptographically secure — use crypto.randomInt/randomBytes.'
    );
  }
}

// --- 5. Real secrets must not be committed in .env.example -----------------
// Placeholders are fine and expected. Flag only values that look like a real
// credential: long, and not obviously a template.
const PLACEHOLDER =
  /(generate|your|example|placeholder|changeme|change[-_ ]?me|replace|insert|todo|xxx+|\$\(|<|here|foo|bar|test|dummy|localhost)/i;
const envExample = read('.env.example');
if (envExample) {
  const secretKeys = [
    'JWT_SECRET',
    'SESSION_SECRET',
    'LINKED_ACCOUNT_ENCRYPTION_KEY',
    'CRYPTO_PAYOUT_PRIVATE_KEY',
  ];
  envExample.split('\n').forEach((text, i) => {
    const m = new RegExp(`^(${secretKeys.join('|')})\\s*=\\s*(.+)$`).exec(text.trim());
    if (!m) return;
    const value = m[2].trim().replace(/^['"]|['"]$/g, '');
    if (!value) return;
    if (PLACEHOLDER.test(value)) return;
    if (value.length < 24) return;
    report(
      'secret-value-in-env-example',
      '.env.example',
      i + 1,
      `${m[1]} in .env.example looks like a real value rather than a placeholder.`
    );
  });
}

// --- 6. .env must be gitignored -------------------------------------------
const gitignore = read('.gitignore');
if (gitignore && !/^\s*\.env\s*$/m.test(gitignore) && !/^\s*\.env\*/m.test(gitignore)) {
  report(
    'env-not-gitignored',
    '.gitignore',
    0,
    '`.env` is not listed in server/.gitignore — real secrets could be committed.'
  );
}

// --- 7. Security env validation must require the two signing secrets -------
const envValidation = read('src/common/env.validation.ts');
if (envValidation) {
  for (const key of ['JWT_SECRET', 'SESSION_SECRET']) {
    const re = new RegExp(`${key}\\s*:\\s*Joi\\.[^\\n]*required\\(`);
    if (!re.test(envValidation)) {
      report(
        'secret-not-required-in-env-validation',
        'src/common/env.validation.ts',
        0,
        `${key} must be Joi-required so the server refuses to boot without it.`
      );
    }
  }
}

const result = {
  checkedAt: new Date().toISOString(),
  checks: 7,
  findingCount: findings.length,
  findings,
  status: findings.length === 0 ? 'passed' : 'failed',
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else if (findings.length === 0) {
  console.log('security-audit: passed — 7 checks, no findings');
} else {
  console.error(`security-audit: FAILED — ${findings.length} finding(s) across 7 checks\n`);
  for (const f of findings) {
    console.error(`  [${f.rule}] ${f.file}${f.line ? `:${f.line}` : ''}\n      ${f.detail}`);
  }
  console.error('');
}

// Exit non-zero so the CI job can actually go red. That was the whole point.
process.exit(findings.length === 0 ? 0 : 1);
