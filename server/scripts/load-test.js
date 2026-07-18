const { performance } = require('node:perf');

async function runLoadTest({
  targetUrl = 'http://127.0.0.1:3000/infrastructure/health',
  requests = 10,
  concurrency = 4,
  requestImpl = null,
} = {}) {
  const fetchImpl = requestImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('A fetch implementation is required to run the load test.');
  }

  const latencies = [];
  let completed = 0;
  let failed = 0;

  const runBatch = async (batchSize) => {
    const batch = Array.from({ length: batchSize }, async () => {
      const startedAt = performance.now();
      try {
        const response = await fetchImpl(targetUrl);
        const status = response?.status ?? 0;
        const latencyMs = performance.now() - startedAt;
        latencies.push(latencyMs);
        if (status >= 200 && status < 400) {
          completed += 1;
        } else {
          failed += 1;
        }
      } catch (error) {
        latencies.push(performance.now() - startedAt);
        failed += 1;
      }
    });

    await Promise.all(batch);
  };

  while (completed + failed < requests) {
    const remaining = requests - (completed + failed);
    const batchSize = Math.min(concurrency, remaining);
    await runBatch(batchSize);
  }

  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const averageLatencyMs = latencies.length > 0 ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : 0;
  const maxLatencyMs = latencies.length > 0 ? Math.max(...latencies) : 0;
  const p95LatencyMs = sortedLatencies.length > 0 ? sortedLatencies[Math.floor(sortedLatencies.length * 0.95) - 1] || sortedLatencies[sortedLatencies.length - 1] : 0;

  return {
    targetUrl,
    requests,
    concurrency,
    completed,
    failed,
    averageLatencyMs,
    maxLatencyMs,
    p95LatencyMs,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const targetUrl = args[0] || process.env.LOAD_TEST_TARGET_URL || 'http://127.0.0.1:3000/infrastructure/health';
  const requests = Number(args[1] || process.env.LOAD_TEST_REQUESTS || 10);
  const concurrency = Number(args[2] || process.env.LOAD_TEST_CONCURRENCY || 4);

  const report = await runLoadTest({ targetUrl, requests, concurrency });
  console.log(JSON.stringify(report, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { runLoadTest };
