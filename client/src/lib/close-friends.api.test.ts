import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getCloseFriends, updateCloseFriends } from './api';

describe('getCloseFriends API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches the close friends list', async () => {
    server.use(
      http.get('*/users/me/close-friends', () => {
        return HttpResponse.json([
          { id: 'friend-1', username: 'alice', displayName: 'Alice' },
          { id: 'friend-2', username: 'bob', displayName: 'Bob' },
        ]);
      })
    );

    const result = await getCloseFriends();
    expect(result).toHaveLength(2);
    expect(result[0].username).toBe('alice');
  });

  it('returns empty array when no close friends', async () => {
    server.use(
      http.get('*/users/me/close-friends', () => {
        return HttpResponse.json([]);
      })
    );

    const result = await getCloseFriends();
    expect(result).toHaveLength(0);
  });

  it('throws on error', async () => {
    server.use(
      http.get('*/users/me/close-friends', () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    await expect(getCloseFriends()).rejects.toThrow();
  });
});

describe('updateCloseFriends API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends PUT to /users/me/close-friends with IDs', async () => {
    let capturedBody: any;

    server.use(
      http.put('*/users/me/close-friends', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          id: 'user-1',
          closeFriends: [{ id: 'friend-1' }],
        });
      })
    );

    const result = await updateCloseFriends(['friend-1']);

    expect(capturedBody).toEqual({ closeFriendIds: ['friend-1'] });
    expect((result as any).closeFriends).toHaveLength(1);
  });

  it('sends empty array to remove all close friends', async () => {
    let capturedBody: any;

    server.use(
      http.put('*/users/me/close-friends', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 'user-1', closeFriends: [] });
      })
    );

    const result = await updateCloseFriends([]);

    expect(capturedBody).toEqual({ closeFriendIds: [] });
    expect((result as any).closeFriends).toHaveLength(0);
  });

  it('throws on error', async () => {
    server.use(
      http.put('*/users/me/close-friends', () => {
        return HttpResponse.json({ message: 'Failed' }, { status: 400 });
      })
    );

    await expect(updateCloseFriends(['friend-1'])).rejects.toThrow();
  });
});
