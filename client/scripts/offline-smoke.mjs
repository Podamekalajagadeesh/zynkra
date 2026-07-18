import { evaluateOfflineSmokeChecks, formatOfflineSmokeReport } from '../src/lib/offlineSmoke.js';

const result = evaluateOfflineSmokeChecks(process.cwd());
console.log(formatOfflineSmokeReport(result));

process.exitCode = result.passed ? 0 : 1;
