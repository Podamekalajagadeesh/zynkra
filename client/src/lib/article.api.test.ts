import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getArticleFeed, getArticleBySlug } from './api';

describe('getArticleFeed API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches paginated articles', async () => {
    server.use(
      http.get('*/articles/feed', ({ request }) => {
        return HttpResponse.json({
          articles: [{ id: 'art-1', title: 'Article' }],
          total: 1,
        });
      })
    );

    const result = await getArticleFeed(1);
    expect(result.articles).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('fetches articles with tag filter', async () => {
    let capturedUrl = '';
    server.use(
      http.get('*/articles/feed', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ articles: [], total: 0 });
      })
    );

    await getArticleFeed(1, 'technology');
    expect(capturedUrl).toContain('tag=technology');
  });

  it('throws on error', async () => {
    server.use(
      http.get('*/articles/feed', () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 });
      })
    );

    await expect(getArticleFeed()).rejects.toThrow();
  });
});

describe('getArticleBySlug API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches article by slug', async () => {
    server.use(
      http.get('*/articles/my-article', () => {
        return HttpResponse.json({ id: 'art-1', title: 'My Article', content: 'Content' });
      })
    );

    const result = await getArticleBySlug('my-article');
    expect(result.title).toBe('My Article');
    expect(result.content).toBe('Content');
  });

  it('throws on 404', async () => {
    server.use(
      http.get('*/articles/missing', () => {
        return HttpResponse.json({ message: 'Article not found' }, { status: 404 });
      })
    );

    await expect(getArticleBySlug('missing')).rejects.toThrow();
  });
});
