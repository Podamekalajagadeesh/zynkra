import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildMemoryProjectSummary } = require('../src/memories/memory-projects.js');

test('builds a collaborative memory project summary from selected memories', () => {
  const result = buildMemoryProjectSummary({
    title: 'Summer reunion archive',
    topic: 'River reunion',
    description: 'A place for friends to collect memories of the reunion',
    memoryCount: 3,
    contributorNames: ['Mina', 'Ari'],
  });

  assert.equal(result.title, 'Summer reunion archive');
  assert.match(result.summary, /River reunion/i);
  assert.equal(result.memoryCount, 3);
  assert.deepEqual(result.contributorNames, ['Mina', 'Ari']);
});
