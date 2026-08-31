import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { buildImageTextSearchPath, followUpSearch, webSearch } from './api';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

describe('image and text search and Web-Connected Search', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('builds an encoded combined-search request path', () => {
    expect(buildImageTextSearchPath(' mountain lake ')).toBe(
      '/search/image-text?q=mountain%20lake',
    );
  });

  it('requests web results for the supplied query', async () => {
    server.use(
      http.get('*/search/web', ({ request }) => {
        expect(new URL(request.url).searchParams.get('q')).toBe('climate');
        return HttpResponse.json({ query: 'climate', results: [{ title: 'Climate', url: 'https://example.com' }] });
      }),
    );

    const result = await webSearch('climate');
    expect(result.results[0].title).toBe('Climate');
  });

  it('sends a follow-up query with its previous search context', async () => {
    server.use(
      http.post('*/search/follow-up', async ({ request }) => {
        const body = await request.json() as { previousQuery: string; followUpQuery: string };
        expect(body).toEqual({ previousQuery: 'mountains', followUpQuery: 'near lakes' });
        return HttpResponse.json({ query: 'mountains near lakes', posts: [] });
      }),
    );

    const result = await followUpSearch('mountains', 'near lakes');
    expect(result.query).toBe('mountains near lakes');
  });
});
