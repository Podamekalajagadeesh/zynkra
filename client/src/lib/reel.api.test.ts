import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getReelById, shareReel, trackReelView, getReelInsights, getReelEffects, getReelSuggestions } from './api';

describe('getReelById API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches a reel by id', async () => {
    server.use(
      http.get('*/reels/post-1', () => {
        return HttpResponse.json({ id: 'post-1', content: 'Reel' });
      })
    );

    const result = await getReelById('post-1');
    expect(result.id).toBe('post-1');
  });
});

describe('shareReel API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /reels/:id/share', async () => {
    server.use(
      http.post('*/reels/post-1/share', () => HttpResponse.json({}))
    );

    await shareReel('post-1');
  });
});

describe('trackReelView API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /reels/:id/view', async () => {
    server.use(
      http.post('*/reels/post-1/view', () => HttpResponse.json({}))
    );

    await trackReelView('post-1');
  });
});

describe('getReelInsights API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches reel insights', async () => {
    server.use(
      http.get('*/reels/post-1/insights', () => {
        return HttpResponse.json({ viewCount: 100, likeCount: 20 });
      })
    );

    const result = await getReelInsights('post-1');
    expect(result.viewCount).toBe(100);
  });
});

describe('getReelEffects API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches reel effects', async () => {
    server.use(
      http.get('*/reels/effects', () => {
        return HttpResponse.json([{ id: 'e1', name: 'Neon' }]);
      })
    );

    const result = await getReelEffects();
    expect(result).toHaveLength(1);
  });
});

describe('getReelSuggestions API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches reel suggestions', async () => {
    server.use(
      http.get('*/reels/suggestions', () => {
        return HttpResponse.json([{ id: 'post-1', content: 'Suggested reel' }]);
      })
    );

    const result = await getReelSuggestions();
    expect(result).toHaveLength(1);
  });
});
