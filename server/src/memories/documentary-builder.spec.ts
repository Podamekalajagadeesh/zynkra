import { buildDocumentarySummary } from './documentary-builder';

/**
 * Converted from `test/memory-documentary.test.js`, which used `node:test`
 * inside a Jest project whose `testMatch` is `['**\/*.spec.ts', '**\/*.test.ts']`.
 * That file was never collected by any runner, so this module — which sits in
 * the live `MemoriesModule`, not in the cut list — had no executing coverage.
 */
describe('buildDocumentarySummary', () => {
  it('builds a documentary summary from multiple memories', () => {
    const result = buildDocumentarySummary({
      title: 'Sunset on the river',
      eventName: 'River reunion',
      memories: [
        { content: 'The lights reflected on the water as we laughed until sunset.' },
        { content: 'I still remember the warmth of your hand when the band started playing.' },
      ],
      participantNames: ['Mina', 'Ari'],
    });

    expect(result.title).toBe('Sunset on the river');
    expect(result.eventName).toBe('River reunion');
    expect(result.summary).toMatch(/River reunion/i);
    expect(result.summary).toMatch(/2 memories/i);
    expect(result.participantNames).toEqual(['Mina', 'Ari']);
    expect(result.memoryCount).toBe(2);
  });

  it('derives a title from the event name when none is given', () => {
    const result = buildDocumentarySummary({ eventName: 'Harbour weekend' });

    expect(result.title).toBe('Harbour weekend documentary');
  });

  it('falls back to a generic event name and title', () => {
    const result = buildDocumentarySummary({});

    expect(result.eventName).toBe('shared memory event');
    expect(result.title).toBe('shared memory event documentary');
  });

  it('says so when no participants were named, instead of printing an empty list', () => {
    const result = buildDocumentarySummary({
      eventName: 'Quiet day',
      memories: [{ content: 'Nothing much happened.' }],
    });

    expect(result.participantNames).toEqual([]);
    expect(result.summary).toContain('Multiple perspectives were woven into the narrative.');
  });

  it('drops blank participant names rather than rendering empty entries', () => {
    const result = buildDocumentarySummary({
      eventName: 'Quiet day',
      participantNames: ['Mina', '', 'Ari'],
    });

    expect(result.participantNames).toEqual(['Mina', 'Ari']);
  });

  it('truncates long highlights at 140 characters', () => {
    const result = buildDocumentarySummary({
      eventName: 'Long tale',
      memories: [{ content: 'x'.repeat(200) }],
    });

    expect(result.highlights[0]).toHaveLength(140);
    expect(result.highlights[0].endsWith('...')).toBe(true);
  });

  it('keeps highlights at exactly 140 characters', () => {
    // 140 is not over the limit, so it must be passed through untouched.
    const result = buildDocumentarySummary({
      eventName: 'Exact fit',
      memories: [{ content: 'y'.repeat(140) }],
    });

    expect(result.highlights[0]).toBe('y'.repeat(140));
  });

  it('caps highlights at four even when more memories are supplied', () => {
    const result = buildDocumentarySummary({
      eventName: 'Marathon',
      memories: Array.from({ length: 9 }, (_, i) => ({ content: `Fragment number ${i}.` })),
    });

    // memoryCount still reports the true total; only the highlight list is capped.
    expect(result.memoryCount).toBe(9);
    expect(result.highlights).toHaveLength(4);
  });

  it('handles an empty memory list without throwing', () => {
    const result = buildDocumentarySummary({ eventName: 'Nothing yet' });

    expect(result.memoryCount).toBe(0);
    expect(result.highlights).toEqual([]);
    expect(result.summary).toContain('compiled from 0 memories');
  });
});
