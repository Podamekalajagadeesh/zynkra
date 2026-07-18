const { execSync } = require('node:child_process');
const path = require('node:path');

function run(command) {
  return execSync(command, { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' }).toString().trim();
}

function main() {
  const results = [];
  try {
    run('npx jest --runInBand --runTestsByPath test/qa-smoke.test.ts test/e2e-smoke.test.ts');
    results.push({ check: 'qa-smoke', status: 'passed' });
  } catch (error) {
    results.push({ check: 'qa-smoke', status: 'failed', error: error.message });
  }

  try {
    const output = run('node scripts/security-audit.js');
    results.push({ check: 'security-audit', status: 'passed', output });
  } catch (error) {
    results.push({ check: 'security-audit', status: 'failed', error: error.message });
  }

  console.log(JSON.stringify(results, null, 2));
}

main();
