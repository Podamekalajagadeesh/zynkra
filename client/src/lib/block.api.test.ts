import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { blockUser, unblockUser, getBlockedUsers } from './api';

describe('blockUser API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /users/:id/block', async () => {
    server.use(
      http.post('*/users/user-1/block', () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const result = await blockUser('user-1');
    expect(result).toBeDefined();
  });

  it('throws on error', async () => {
    server.use(
      http.post('*/users/user-1/block', () => {
        return HttpResponse.json({ message: 'User not found' }, { status: 404 });
      })
    );

    await expect(blockUser('user-1')).rejects.toThrow();
  });
});

describe('unblockUser API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends DELETE to /users/:id/block', async () => {
    server.use(
      http.delete('*/users/user-1/block', () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const result = await unblockUser('user-1');
    expect(result).toBeDefined();
  });

  it('throws on error', async () => {
    server.use(
      http.delete('*/users/user-1/block', () => {
        return HttpResponse.json({ message: 'Not blocked' }, { status: 400 });
      })
    );

    await expect(unblockUser('user-1')).rejects.toThrow();
  });
});

describe('getBlockedUsers API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches blocked users list', async () => {
    server.use(
      http.get('*/users/blocked', () => {
        return HttpResponse.json([
          { id: 'user-2', username: 'blocked_user', displayName: 'Blocked' },
        ]);
      })
    );

    const result = await getBlockedUsers();
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('blocked_user');
  });

  it('returns empty array when no blocked users', async () => {
    server.use(
      http.get('*/users/blocked', () => {
        return HttpResponse.json([]);
      })
    );

    const result = await getBlockedUsers();
    expect(result).toHaveLength(0);
  });
});
