import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { voteOnPoll, createPost } from './api';

vi.mock('./offlineSync', () => ({
  enqueueOfflineOperation: vi.fn().mockResolvedValue({ id: 'offline-1', createdAt: new Date().toISOString() }),
}));
Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

describe('voteOnPoll API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /polls/:pollOptionId/vote', async () => {
    server.use(
      http.post('*/polls/opt-1/vote', () => {
        return HttpResponse.json({ id: 'poll-1', options: [{ id: 'opt-1', voteCount: 1 }] });
      })
    );

    const result = await voteOnPoll('opt-1');
    expect(result).toBeDefined();
  });

  it('throws on error', async () => {
    server.use(
      http.post('*/polls/opt-1/vote', () => {
        return HttpResponse.json({ message: 'Already voted' }, { status: 401 });
      })
    );

    await expect(voteOnPoll('opt-1')).rejects.toThrow();
  });

  it('throws when poll option not found', async () => {
    server.use(
      http.post('*/polls/missing/vote', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      })
    );

    await expect(voteOnPoll('missing')).rejects.toThrow();
  });
});

describe('createPost with poll', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends poll data in request body', async () => {
    let capturedBody: any;
    server.use(
      http.post('*/posts', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 'post-1', content: 'Vote now' });
      })
    );

    await createPost('Vote now', [], 'public', '', false, false, '', '', [], { question: 'Fav?', options: ['A', 'B'] });

    expect(capturedBody.poll).toBeDefined();
    expect(capturedBody.poll.question).toBe('Fav?');
    expect(capturedBody.poll.options).toEqual([{ text: 'A' }, { text: 'B' }]);
  });

  it('sends undefined poll when null', async () => {
    let capturedBody: any;
    server.use(
      http.post('*/posts', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 'post-2', content: 'Hello' });
      })
    );

    await createPost('Hello');

    expect(capturedBody.poll).toBeUndefined();
  });

  it('throws on error with poll data', async () => {
    server.use(
      http.post('*/posts', () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      })
    );

    await expect(
      createPost('Fail', [], 'public', '', false, false, '', '', [], { question: 'Q?', options: ['X'] })
    ).rejects.toThrow();
  });
});
