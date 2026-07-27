import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getStories, addStoryReaction, addStoryReply, trackStoryView, getStoryViews } from './api';

describe('getStories API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches stories list', async () => {
    server.use(
      http.get('*/stories', () => {
        return HttpResponse.json([
          { id: 'story-1', mediaUrl: '/img.jpg', user: { id: 'u1' } },
        ]);
      })
    );

    const result = await getStories();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('story-1');
  });

  it('throws on error', async () => {
    server.use(
      http.get('*/stories', () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    await expect(getStories()).rejects.toThrow();
  });
});

describe('addStoryReaction API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /stories/:id/react', async () => {
    let capturedBody: any;
    server.use(
      http.post('*/stories/story-1/react', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ message: 'Reacted' });
      })
    );

    await addStoryReaction('story-1', '❤️');
    expect(capturedBody).toEqual({ reaction: '❤️' });
  });
});

describe('addStoryReply API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /stories/:id/reply', async () => {
    let capturedBody: any;
    server.use(
      http.post('*/stories/story-1/reply', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ message: 'Replied' });
      })
    );

    await addStoryReply('story-1', 'Cool story!');
    expect(capturedBody).toEqual({ text: 'Cool story!' });
  });
});

describe('trackStoryView API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /stories/:id/view', async () => {
    let capturedBody: any;
    server.use(
      http.post('*/stories/story-1/view', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ message: 'Viewed' });
      })
    );

    await trackStoryView('story-1', false);
    expect(capturedBody).toEqual({ isAnonymous: false });
  });
});

describe('getStoryViews API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches story views', async () => {
    server.use(
      http.get('*/stories/story-1/views', () => {
        return HttpResponse.json([{ id: 'sv-1', user: { id: 'u2' } }]);
      })
    );

    const result = await getStoryViews('story-1');
    expect(result).toHaveLength(1);
  });
});
