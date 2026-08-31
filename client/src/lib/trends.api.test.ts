import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getTrendingTopics } from './api';

describe('getTrendingTopics API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('requests the selected time window', async () => {
    server.use(
      http.get('*/trends', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('days')).toBe('30');
        expect(url.searchParams.get('limit')).toBe('10');
        return HttpResponse.json({ globalTrends: [{ tag: '#test', occurrenceCount: 3, score: 1 }], days: 30 });
      }),
    );

    const result = await getTrendingTopics(30);
    expect(result.days).toBe(30);
    expect(result.globalTrends[0].tag).toBe('#test');
  });
});
