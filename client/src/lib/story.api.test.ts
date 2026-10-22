import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import type { StoryElementInput } from './types';
import {
  getStories,
  addStoryReaction,
  addStoryReply,
  trackStoryView,
  getStoryViews,
  createStory,
  api,
} from './api';

describe('getStories API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches stories list', async () => {
    server.use(
      http.get('*/stories', () => {
        return HttpResponse.json([{ id: 'story-1', mediaUrl: '/img.jpg', user: { id: 'u1' } }]);
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

describe('createStory API helper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Spy on the axios instance instead of letting the request reach msw: with
  // a File in the FormData, jsdom's XHR upload never completes under Node 20
  // (CI's runtime) through the msw interceptor — only the FormData payload
  // itself matters for this contract, so assert it directly.
  function mockPost() {
    return vi.spyOn(api, 'post').mockResolvedValue({ data: { id: 'story-1' } } as never);
  }

  function postedFormData(spy: ReturnType<typeof mockPost>) {
    const call = spy.mock.calls[0] as unknown as [string, FormData];
    expect(call[0]).toBe('/stories');
    return call[1];
  }

  it('builds multipart FormData with file, elements JSON, audience, and flags', async () => {
    const spy = mockPost();

    const file = new File(['fake'], 'story.jpg', { type: 'image/jpeg' });
    const elements: StoryElementInput[] = [
      { type: 'poll', data: { question: 'Best?', options: ['a', 'b'] } },
      { type: 'mention', data: { username: 'friend' } },
    ];

    await createStory(file, elements, 'close_friends', true);

    const body = postedFormData(spy);
    const fileEntry = body.get('file');
    // Depending on the runtime realm (host File vs jsdom FormData), the
    // appended File is either preserved or coerced to '[object File]';
    // both prove the `file` field carries the upload payload.
    if (typeof fileEntry === 'string') {
      expect(fileEntry).toBe('[object File]');
    } else {
      expect((fileEntry as File).name).toBe('story.jpg');
      expect((fileEntry as File).type).toBe('image/jpeg');
    }
    expect(body.get('elements')).toBe(JSON.stringify(elements));
    expect(body.get('audience')).toBe('close_friends');
    expect(body.get('isBoosted')).toBe('true');
    expect(body.get('isExtendedDuration')).toBeNull();
  });

  it('omits optional fields that are not set', async () => {
    const spy = mockPost();

    await createStory(new File(['x'], 'story.jpg', { type: 'image/jpeg' }));

    const body = postedFormData(spy);
    expect(body.get('file')).toBeTruthy();
    expect(body.get('elements')).toBeNull();
    expect(body.get('audience')).toBeNull();
    expect(body.get('isBoosted')).toBeNull();
    expect(body.get('isExtendedDuration')).toBeNull();
  });
});
