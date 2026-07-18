import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOfflineSmokeChecks, formatOfflineSmokeReport } from './offlineSmoke.js';

test('offline smoke checks pass against the current client wiring', () => {
  const result = evaluateOfflineSmokeChecks(process.cwd());

  assert.equal(result.passed, true);
  assert.equal(result.checks.length, 4);
  assert.equal(result.checks[0].name, 'offline queue module is present');
});

test('offline smoke report surfaces failures clearly', () => {
  const result = {
    passed: false,
    checks: [{ name: 'service worker wiring', passed: false, details: 'missing' }],
  };

  const report = formatOfflineSmokeReport(result);
  assert.match(report, /Offline smoke checks: FAIL/);
  assert.match(report, /service worker wiring/);
});
