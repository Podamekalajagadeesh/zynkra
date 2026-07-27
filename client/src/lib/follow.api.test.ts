import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import {
  followUser,
  unfollowUser,
  sendFollowRequest,
  getFollowRequests,
  acceptFollowRequest,
  denyFollowRequest,
  getFollowSuggestions,
  getFollowers,
  getMyFollowers,
  getMutualFollows,
} from './api';

describe('followUser API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /users/:id/follow and returns response', async () => {
    server.use(
      http.post('*/users/user-1/follow', () => {
        return HttpResponse.json({ message: 'Followed successfully' });
      })
    );

    const result = await followUser('user-1');
    expect(result.message).toBe('Followed successfully');
  });

  it('throws on error', async () => {
    server.use(
      http.post('*/users/user-1/follow', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      })
    );

    await expect(followUser('user-1')).rejects.toThrow();
  });
});

describe('unfollowUser API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends DELETE to /users/:id/follow and returns response', async () => {
    server.use(
      http.delete('*/users/user-1/follow', () => {
        return HttpResponse.json({ message: 'Unfollowed successfully' });
      })
    );

    const result = await unfollowUser('user-1');
    expect(result.message).toBe('Unfollowed successfully');
  });
});

describe('follow request API helpers', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sendFollowRequest sends POST to /users/:id/follow-request', async () => {
    server.use(
      http.post('*/users/user-1/follow-request', () => {
        return HttpResponse.json({ message: 'Request sent' });
      })
    );

    const result = await sendFollowRequest('user-1');
    expect(result.message).toBe('Request sent');
  });

  it('getFollowRequests fetches pending requests', async () => {
    server.use(
      http.get('*/users/follow-requests', () => {
        return HttpResponse.json([
          { id: 'req-1', user: { id: 'user-2', username: 'follower' } },
        ]);
      })
    );

    const result = await getFollowRequests();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('req-1');
  });

  it('acceptFollowRequest sends POST', async () => {
    server.use(
      http.post('*/users/follow-requests/req-1/accept', () => {
        return HttpResponse.json({ message: 'Accepted' });
      })
    );

    const result = await acceptFollowRequest('req-1');
    expect(result.message).toBe('Accepted');
  });

  it('denyFollowRequest sends POST', async () => {
    server.use(
      http.post('*/users/follow-requests/req-1/deny', () => {
        return HttpResponse.json({ message: 'Denied' });
      })
    );

    const result = await denyFollowRequest('req-1');
    expect(result.message).toBe('Denied');
  });
});

describe('getFollowSuggestions API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches follow suggestions', async () => {
    server.use(
      http.get('*/users/suggestions', () => {
        return HttpResponse.json([
          { id: 'user-2', username: 'suggested_user', displayName: 'Suggested' },
        ]);
      })
    );

    const result = await getFollowSuggestions();
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('suggested_user');
  });
});

describe('getFollowers API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches followers list for a user', async () => {
    server.use(
      http.get('*/users/user-1/followers', () => {
        return HttpResponse.json([
          { id: 'f1', username: 'alice', displayName: 'Alice' },
          { id: 'f2', username: 'bob', displayName: 'Bob' },
        ]);
      })
    );

    const result = await getFollowers('user-1');
    expect(result).toHaveLength(2);
    expect(result[0].username).toBe('alice');
  });

  it('throws on error', async () => {
    server.use(
      http.get('*/users/user-1/followers', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      })
    );

    await expect(getFollowers('user-1')).rejects.toThrow();
  });
});

describe('getMyFollowers API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches current user followers', async () => {
    server.use(
      http.get('*/users/me/followers', () => {
        return HttpResponse.json([
          { id: 'f1', username: 'alice', displayName: 'Alice' },
        ]);
      })
    );

    const result = await getMyFollowers();
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('alice');
  });
});

describe('getMutualFollows API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches mutual follows between two users', async () => {
    server.use(
      http.get('*/users/user-1/mutual', () => {
        return HttpResponse.json([
          { id: 'mutual-1', username: 'alice', displayName: 'Alice' },
        ]);
      })
    );

    const result = await getMutualFollows('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('alice');
  });

  it('throws on error', async () => {
    server.use(
      http.get('*/users/user-1/mutual', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      })
    );

    await expect(getMutualFollows('user-1')).rejects.toThrow();
  });
});
