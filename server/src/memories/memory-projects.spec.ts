import { buildMemoryProjectSummary } from './memory-projects';

// Ported from `test/memory-projects.test.ts`, which used `node:test` with
// ESM-only syntax (`import.meta`) that cannot compile under this repo's
// CommonJS ts-jest setup — it was collected by `test:integration` but always
// failed to load, and no other script ran it.
describe('buildMemoryProjectSummary', () => {
  it('builds a collaborative memory project summary from selected memories', () => {
    const result = buildMemoryProjectSummary({
      title: 'Summer reunion archive',
      topic: 'River reunion',
      description: 'A place for friends to collect memories of the reunion',
      memoryCount: 3,
      contributorNames: ['Mina', 'Ari'],
    });

    expect(result.title).toBe('Summer reunion archive');
    expect(result.summary).toMatch(/River reunion/i);
    expect(result.memoryCount).toBe(3);
    expect(result.contributorNames).toEqual(['Mina', 'Ari']);
  });
});
