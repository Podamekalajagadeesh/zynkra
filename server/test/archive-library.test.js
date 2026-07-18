const test = require('node:test');
const assert = require('node:assert/strict');
const { buildArchiveLibrarySummary } = require('../src/cultural-preservation/archive-library.js');

test('builds a public archive library summary from a preservation entry', () => {
  const result = buildArchiveLibrarySummary({
    title: 'Grandmother\'s harvest song',
    description: 'A preserved oral memory from the coastal village.',
    materialType: 'story',
    language: 'Quechua',
  });

  assert.equal(result.title, 'Grandmother\'s harvest song');
  assert.match(result.summary, /oral memory/i);
  assert.equal(result.materialType, 'story');
  assert.equal(result.language, 'Quechua');
});
