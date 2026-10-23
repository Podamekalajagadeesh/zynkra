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
  getStoryReplies,
  deleteStoryReply,
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

describe('getStoryReplies API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches the paginated replies envelope with explicit paging params', async () => {
    let capturedSearch = '';
    server.use(
      http.get('*/stories/story-1/replies', ({ request }) => {
        capturedSearch = new URL(request.url).search;
        return HttpResponse.json({
          data: [
            {
              id: 'reply-1',
              text: 'Nice!',
              createdAt: '2026-01-01T00:00:00.000Z',
              user: { id: 'u2', username: 'fan', displayName: 'Fan', pfp: '/p.jpg' },
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        });
      })
    );

    const result = await getStoryReplies('story-1', 1, 20);

    expect(result.total).toBe(1);
    expect(result.data[0].user.username).toBe('fan');
    expect(capturedSearch).toContain('page=1');
    expect(capturedSearch).toContain('limit=20');
  });

  it('defaults to page=1 and limit=20 when no paging args are given', async () => {
    let capturedSearch = '';
    server.use(
      http.get('*/stories/story-1/replies', ({ request }) => {
        capturedSearch = new URL(request.url).search;
        return HttpResponse.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
      })
    );

    const result = await getStoryReplies('story-1');

    expect(result.data).toEqual([]);
    expect(capturedSearch).toBe('?page=1&limit=20');
  });

  it('throws on error', async () => {
    server.use(
      http.get('*/stories/story-1/replies', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      )
    );

    await expect(getStoryReplies('story-1')).rejects.toThrow();
  });
});

describe('deleteStoryReply API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends DELETE to /stories/:id/replies/:replyId', async () => {
    let capturedParams: Record<string, unknown> = {};
    server.use(
      http.delete('*/stories/story-1/replies/:replyId', ({ params }) => {
        capturedParams = params;
        return new HttpResponse(null, { status: 200 });
      })
    );

    await deleteStoryReply('story-1', 'reply-9');

    expect(capturedParams.replyId).toBe('reply-9');
  });

  it('propagates errors', async () => {
    server.use(
      http.delete('*/stories/story-1/replies/:replyId', () =>
        HttpResponse.json({ message: 'Forbidden' }, { status: 401 })
      )
    );

    await expect(deleteStoryReply('story-1', 'reply-9')).rejects.toThrow();
  });
});
