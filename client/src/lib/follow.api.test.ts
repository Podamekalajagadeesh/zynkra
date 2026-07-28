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
  getMyFollowing,
  removeFollower,
  getMutualFollows,
  blockUser,
  unblockUser,
  getCloseFriends,
  updateCloseFriends,
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
      http.get('*/users/me/follow-requests/pending', () => {
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

describe('getMyFollowing API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches the current user following list', async () => {
    server.use(
      http.get('*/users/me/following', () => {
        return HttpResponse.json([
          { id: 'f1', username: 'alice', displayName: 'Alice' },
          { id: 'f2', username: 'bob', displayName: 'Bob' },
        ]);
      })
    );

    const result = await getMyFollowing();
    expect(result).toHaveLength(2);
    expect(result[0].username).toBe('alice');
  });

  it('returns empty array when not following anyone', async () => {
    server.use(
      http.get('*/users/me/following', () => {
        return HttpResponse.json([]);
      })
    );

    const result = await getMyFollowing();
    expect(result).toHaveLength(0);
  });

  it('throws on error', async () => {
    server.use(
      http.get('*/users/me/following', () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    await expect(getMyFollowing()).rejects.toThrow();
  });
});

describe('removeFollower API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends DELETE to /users/followers/:id and returns response', async () => {
    server.use(
      http.delete('*/users/followers/user-1', () => {
        return HttpResponse.json({ message: 'Follower removed' });
      })
    );

    const result = await removeFollower('user-1');
    expect(result.message).toBe('Follower removed');
  });

  it('throws on error', async () => {
    server.use(
      http.delete('*/users/followers/user-1', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      })
    );

    await expect(removeFollower('user-1')).rejects.toThrow();
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

describe('blockUser API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends POST to /users/:id/block and returns response', async () => {
    server.use(
      http.post('*/users/user-1/block', () => {
        return HttpResponse.json({ message: 'Blocked successfully' });
      })
    );

    const result = await blockUser('user-1');
    expect(result.message).toBe('Blocked successfully');
  });

  it('throws on error', async () => {
    server.use(
      http.post('*/users/user-1/block', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      })
    );

    await expect(blockUser('user-1')).rejects.toThrow();
  });
});

describe('unblockUser API helper', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends DELETE to /users/:id/block and returns response', async () => {
    server.use(
      http.delete('*/users/user-1/block', () => {
        return HttpResponse.json({ message: 'Unblocked successfully' });
      })
    );

    const result = await unblockUser('user-1');
    expect(result.message).toBe('Unblocked successfully');
  });

  it('throws on error', async () => {
    server.use(
      http.delete('*/users/user-1/block', () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      })
    );

    await expect(unblockUser('user-1')).rejects.toThrow();
  });
});

describe('close friends API helpers', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches close friends list', async () => {
    server.use(
      http.get('*/users/me/close-friends', () => {
        return HttpResponse.json([
          { id: 'cf-1', username: 'close_friend', displayName: 'Close Friend' },
        ]);
      })
    );

    const result = await getCloseFriends();
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('close_friend');
  });

  it('updates close friends list', async () => {
    server.use(
      http.put('*/users/me/close-friends', () => {
        return HttpResponse.json({ id: 'user-1', closeFriends: [{ id: 'cf-1' }] });
      })
    );

    const result = await updateCloseFriends(['cf-1']);
    expect(result.closeFriends).toHaveLength(1);
  });

  it('throws on error when fetching close friends', async () => {
    server.use(
      http.get('*/users/me/close-friends', () => {
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
      })
    );

    await expect(getCloseFriends()).rejects.toThrow();
  });
});
