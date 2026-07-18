const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDocumentarySummary } = require('../src/memories/documentary-builder');

test('builds a documentary summary from multiple memories', () => {
  const result = buildDocumentarySummary({
    title: 'Sunset on the river',
    eventName: 'River reunion',
    memories: [
      { content: 'The lights reflected on the water as we laughed until sunset.' },
      { content: 'I still remember the warmth of your hand when the band started playing.' },
    ],
    participantNames: ['Mina', 'Ari'],
  });

  assert.equal(result.title, 'Sunset on the river');
  assert.match(result.summary, /River reunion/i);
  assert.match(result.summary, /2 memories/i);
  assert.deepEqual(result.participantNames, ['Mina', 'Ari']);
});
