import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

// Mock the offlineSync module
vi.mock('./offlineSync', () => ({
  enqueueOfflineOperation: vi.fn().mockResolvedValue({ id: 'offline-1', createdAt: new Date().toISOString() }),
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

import { createPost, updatePost, deletePost, getPosts, getShortsFeed } from './api';

describe('createPost API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /posts and returns the post', async () => {
    server.use(
      http.post('*/posts', () => {
        return HttpResponse.json({
          id: 'post-1',
          content: 'Hello world',
          authorId: 'user-1',
          createdAt: new Date().toISOString(),
        });
      })
    );

    const result = await createPost('Hello world');
    expect(result.id).toBe('post-1');
    expect(result.content).toBe('Hello world');
  });

  it('throws on 401 unauthorized', async () => {
    server.use(
      http.post('*/posts', () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    await expect(createPost('Hello')).rejects.toThrow();
  });

  it('throws on 400 validation error', async () => {
    server.use(
      http.post('*/posts', () => {
        return HttpResponse.json({ message: 'Content is required' }, { status: 400 });
      })
    );

    await expect(createPost('')).rejects.toThrow();
  });
});

describe('updatePost API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends PATCH to /posts/:id and returns the updated post', async () => {
    server.use(
      http.patch('*/posts/post-1', () => {
        return HttpResponse.json({
          id: 'post-1',
          content: 'Updated content',
        });
      })
    );

    const result = await updatePost('post-1', 'Updated content');
    expect(result.content).toBe('Updated content');
  });
});

describe('deletePost API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends DELETE to /posts/:id', async () => {
    server.use(
      http.delete('*/posts/post-1', () => {
        return HttpResponse.json({ message: 'Deleted' });
      })
    );

    const result = await deletePost('post-1');
    expect(result).toBeDefined();
  });

  it('throws on error', async () => {
    server.use(
      http.delete('*/posts/post-1', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      })
    );

    await expect(deletePost('post-1')).rejects.toThrow();
  });
});

describe('getPosts API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches posts from feed', async () => {
    server.use(
      http.get('*/feed/for-you', () => {
        return HttpResponse.json([
          { id: 'post-1', content: 'Hello' },
          { id: 'post-2', content: 'World' },
        ]);
      })
    );

    const result = await getPosts();
    expect(result).toHaveLength(2);
  });
});

describe('getShortsFeed API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches shorts feed', async () => {
    server.use(
      http.get('*/feed/shorts', () => {
        return HttpResponse.json([
          { id: 'reel-1', mediaUrl: '/video1.mp4' },
          { id: 'reel-2', mediaUrl: '/video2.mp4' },
        ]);
      })
    );

    const result = await getShortsFeed();
    expect(result).toHaveLength(2);
    expect(result[0].mediaUrl).toBe('/video1.mp4');
  });

  it('throws on error', async () => {
    server.use(
      http.get('*/feed/shorts', () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    await expect(getShortsFeed()).rejects.toThrow();
  });
});
