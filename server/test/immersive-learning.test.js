const test = require('node:test');
const assert = require('node:assert/strict');
const { buildImmersiveLearningSession } = require('../src/skill-sharing/immersive-learning.js');

test('builds a guided immersive learning session from an experience blueprint', () => {
  const result = buildImmersiveLearningSession({
    title: 'Neural pottery basics',
    topic: 'Pottery',
    skill: 'Throwing clay',
    durationMinutes: 18,
    steps: ['Warm-up', 'Center clay', 'Shape vessel'],
  });

  assert.equal(result.title, 'Neural pottery basics');
  assert.match(result.summary, /Pottery/i);
  assert.equal(result.durationMinutes, 18);
  assert.deepEqual(result.steps, ['Warm-up', 'Center clay', 'Shape vessel']);
  assert.match(result.takeaway, /Clay/i);
});
