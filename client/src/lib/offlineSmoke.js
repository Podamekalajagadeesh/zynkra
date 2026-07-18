import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

export function evaluateOfflineSmokeChecks(rootDir = path.resolve(__dirname, '..', '..')) {
  const clientDir = path.resolve(rootDir);
  const modulePath = path.join(clientDir, 'src/lib/offlineSync.ts');
  const serviceWorkerPath = path.join(clientDir, 'public/sw.js');
  const mainPath = path.join(clientDir, 'src/main.tsx');

  const checks = [
    {
      name: 'offline queue module is present',
      passed: existsSync(modulePath),
      details: path.relative(clientDir, modulePath),
    },
  ];

  if (existsSync(modulePath)) {
    const moduleContent = readIfExists(modulePath);
    checks.push({
      name: 'offline queue exposes sync and retry hooks',
      passed: moduleContent.includes('enqueueOfflineOperation') && moduleContent.includes('syncPendingOfflineOperations') && moduleContent.includes('initializeOfflineSync'),
      details: 'offlineSync.ts includes queueing, syncing, and initialization hooks',
    });
  } else {
    checks.push({
      name: 'offline queue exposes sync and retry hooks',
      passed: false,
      details: 'offlineSync.ts not found',
    });
  }

  if (existsSync(serviceWorkerPath)) {
    const serviceWorkerContent = readIfExists(serviceWorkerPath);
    checks.push({
      name: 'service worker handles offline sync events',
      passed: serviceWorkerContent.includes('zynkra-offline-sync') && serviceWorkerContent.includes('sync'),
      details: 'service worker contains the offline sync tag and sync handling',
    });
  } else {
    checks.push({
      name: 'service worker handles offline sync events',
      passed: false,
      details: 'public/sw.js not found',
    });
  }

  if (existsSync(mainPath)) {
    const mainContent = readIfExists(mainPath);
    checks.push({
      name: 'app bootstraps offline sync on startup',
      passed: mainContent.includes('initializeOfflineSync()'),
      details: 'main.tsx initializes offline sync during app startup',
    });
  } else {
    checks.push({
      name: 'app bootstraps offline sync on startup',
      passed: false,
      details: 'src/main.tsx not found',
    });
  }

  return {
    passed: checks.every((check) => check.passed),
    checks,
  };
}

export function formatOfflineSmokeReport(result) {
  const lines = [`Offline smoke checks: ${result.passed ? 'PASS' : 'FAIL'}`];
  for (const check of result.checks) {
    lines.push(`- [${check.passed ? 'x' : ' '}] ${check.name}: ${check.details}`);
  }
  return lines.join('\n');
}
