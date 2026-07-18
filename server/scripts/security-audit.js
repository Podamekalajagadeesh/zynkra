const fs = require('node:fs');
const path = require('node:path');

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (/\.(js|ts|tsx|json)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function auditSecurity() {
  const repoRoot = path.resolve(__dirname, '..');
  const files = walk(repoRoot);
  const findings = [];

  for (const file of files) {
    if (file.endsWith('security-audit.js')) continue;
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('process.env.SECRET') || content.includes('DEFAULT_PASSWORD')) {
      findings.push({ file, issue: 'Hard-coded secret-like values detected' });
    }
    if (content.includes('eval(')) {
      findings.push({ file, issue: 'Use of eval() detected' });
    }
  }

  return {
    checkedFiles: files.length,
    findings,
    status: findings.length === 0 ? 'passed' : 'needs-attention',
  };
}

if (require.main === module) {
  const report = auditSecurity();
  console.log(JSON.stringify(report, null, 2));
}

module.exports = { auditSecurity };
