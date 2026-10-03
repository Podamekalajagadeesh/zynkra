import { Logger } from '@nestjs/common';
import { PostFederationService } from './post-federation.service';
import { Post, PostVisibility } from '../posts/entities/post.entity';

function makeService(
  config: Record<string, string>,
  federationService: any = undefined,
) {
  return new (PostFederationService as any)(
    { get: (token: string) => (token === 'FederationService' ? federationService : undefined) },
    { get: (key: string, fallback?: any) => (config[key] !== undefined ? config[key] : (fallback ?? null)) },
  );
}

/** Flush the pending microtask queue so fire-and-forget work is observable. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    content: 'hello federation',
    visibility: PostVisibility.PUBLIC,
    isDraft: false,
    isAnonymous: false,
    isEncrypted: false,
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    ...overrides,
  } as Post;
}

beforeAll(() => {
  Logger.overrideLogger(false);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('isEnabled', () => {
  it('is off unless FEDERATION_ENABLED=true', () => {
    expect(makeService({}).isEnabled()).toBe(false);
    expect(makeService({ FEDERATION_ENABLED: 'false' }).isEnabled()).toBe(false);
    expect(makeService({ FEDERATION_ENABLED: 'true' }).isEnabled()).toBe(true);
  });
});

describe('federateNewPost — eligibility', () => {
  const federationService = {
    getFollowerInstanceDomains: jest.fn().mockResolvedValue(['mastodon.example']),
    federatePost: jest.fn().mockResolvedValue({
      activityId: 'a1',
      requested: 1,
      delivered: 1,
      failed: 0,
      results: [],
    }),
  };

  beforeEach(() => {
    federationService.getFollowerInstanceDomains.mockClear();
    federationService.federatePost.mockClear();
  });

  it('does nothing when federation is disabled', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'false' }, federationService);
    service.federateNewPost(makePost(), 'user-1');
    await settle();
    expect(federationService.federatePost).not.toHaveBeenCalled();
  });

  it('federates a public post to the author follower domains', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);
    service.federateNewPost(makePost(), 'user-1');
    await settle();

    expect(federationService.getFollowerInstanceDomains).toHaveBeenCalledWith('user-1');
    expect(federationService.federatePost).toHaveBeenCalledTimes(1);
    const [authorId, dto, targets] = federationService.federatePost.mock.calls[0];
    expect(authorId).toBe('user-1');
    expect(dto.content).toBe('hello federation');
    expect(dto.activityId).toBe('post-1');
    expect(targets).toEqual(['mastodon.example']);
  });

  it('skips non-public posts', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);
    // Every non-public visibility, including the ones added later — a new
    // enum member must not silently start federating.
    for (const visibility of [
      PostVisibility.PRIVATE,
      PostVisibility.FRIENDS,
      PostVisibility.ONLY_ME,
      PostVisibility.UNLISTED,
      PostVisibility.PROFILE_ONLY,
    ]) {
      service.federateNewPost(makePost({ visibility }), 'user-1');
    }
    await settle();

    // Federating a non-public post would hand it to every connected peer and
    // leak the audience boundary the local instance enforces.
    expect(federationService.federatePost).not.toHaveBeenCalled();
  });

  it('skips encrypted posts', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);
    service.federateNewPost(
      makePost({ isEncrypted: true, content: '[Encrypted Content]' }),
      'user-1',
    );
    await settle();

    // The ciphertext is keyed to a recipient set that does not exist remotely,
    // and the body is a placeholder, so peers would store garbage.
    expect(federationService.federatePost).not.toHaveBeenCalled();
  });

  it('skips anonymous posts', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);
    service.federateNewPost(makePost({ isAnonymous: true }), 'user-1');
    await settle();

    // There is no author to attribute the activity to.
    expect(federationService.federatePost).not.toHaveBeenCalled();
  });

  it('skips drafts', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);
    service.federateNewPost(makePost({ isDraft: true }), 'user-1');
    await settle();

    expect(federationService.federatePost).not.toHaveBeenCalled();
  });

  it('skips empty content and the encrypted placeholder', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);
    service.federateNewPost(makePost({ content: '' }), 'user-1');
    service.federateNewPost(makePost({ content: '[Encrypted Content]' }), 'user-1');
    await settle();

    expect(federationService.federatePost).not.toHaveBeenCalled();
  });

  it('does not call federatePost when the author has no remote followers', async () => {
    federationService.getFollowerInstanceDomains.mockResolvedValue([]);
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);

    service.federateNewPost(makePost(), 'user-1');
    await settle();

    expect(federationService.federatePost).not.toHaveBeenCalled();
  });
});

describe('federatePostDeletion', () => {
  const federationService = {
    getFollowerInstanceDomains: jest.fn().mockResolvedValue(['mastodon.example']),
    federateDelete: jest.fn().mockResolvedValue({
      activityId: 'a1',
      requested: 1,
      delivered: 1,
      failed: 0,
      results: [],
    }),
  };

  beforeEach(() => {
    federationService.getFollowerInstanceDomains.mockClear();
    federationService.federateDelete.mockClear();
    federationService.getFollowerInstanceDomains.mockResolvedValue(['mastodon.example']);
    federationService.federateDelete.mockResolvedValue({
      activityId: 'a1',
      requested: 1,
      delivered: 1,
      failed: 0,
      results: [],
    });
  });

  it('does nothing when federation is disabled', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'false' }, federationService);
    service.federatePostDeletion('post-1', 'user-1');
    await settle();
    expect(federationService.federateDelete).not.toHaveBeenCalled();
  });

  it('deletes on the author follower domains', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);
    service.federatePostDeletion('post-1', 'user-1');
    await settle();

    expect(federationService.federateDelete).toHaveBeenCalledWith('user-1', 'post-1', [
      'mastodon.example',
    ]);
  });

  it('skips silently when the author has no remote followers', async () => {
    federationService.getFollowerInstanceDomains.mockResolvedValue([]);
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);

    service.federatePostDeletion('post-1', 'user-1');
    await settle();

    expect(federationService.federateDelete).not.toHaveBeenCalled();
  });

  it('tolerates a Delete that reports it was never federated', async () => {
    federationService.federateDelete.mockResolvedValue({
      activityId: '',
      requested: 1,
      delivered: 0,
      failed: 0,
      results: [],
      skipped: true,
      reason: 'no recorded federated activity for this post',
    });
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);

    await expect(
      new Promise<void>((resolve) => {
        service.federatePostDeletion('post-1', 'user-1');
        resolve();
      }),
    ).resolves.toBeUndefined();
    await settle();
  });

  it('swallows a Delete failure', async () => {
    federationService.federateDelete.mockRejectedValue(new Error('peer unreachable'));
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);

    // The local post is already gone and the delete already acknowledged; a
    // peer being unreachable must not fail it.
    await expect(
      new Promise<void>((resolve) => {
        service.federatePostDeletion('post-1', 'user-1');
        resolve();
      }),
    ).resolves.toBeUndefined();
    await settle();
  });
});

describe('federatePostUpdate — eligibility', () => {
  const federationService = {
    getFollowerInstanceDomains: jest.fn().mockResolvedValue(['mastodon.example']),
    federateUpdate: jest.fn().mockResolvedValue({
      activityId: 'u1',
      requested: 1,
      delivered: 1,
      failed: 0,
      results: [],
    }),
  };

  beforeEach(() => {
    federationService.federateUpdate.mockClear();
    federationService.federateUpdate.mockResolvedValue({
      activityId: 'u1',
      requested: 1,
      delivered: 1,
      failed: 0,
      results: [],
    });
  });

  it('does nothing when federation is disabled', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'false' }, federationService);
    service.federatePostUpdate(makePost(), 'user-1');
    await settle();
    expect(federationService.federateUpdate).not.toHaveBeenCalled();
  });

  it('propagates an edit of a public post', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);
    service.federatePostUpdate(makePost({ content: 'edited' }), 'user-1');
    await settle();

    expect(federationService.federateUpdate).toHaveBeenCalledWith(
      'user-1',
      'post-1',
      'edited',
    );
  });

  it('skips the same shapes create skips', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);

    for (const post of [
      makePost({ isDraft: true }),
      makePost({ isAnonymous: true }),
      makePost({ isEncrypted: true }),
      makePost({ visibility: PostVisibility.PRIVATE }),
      makePost({ visibility: PostVisibility.FRIENDS }),
      makePost({ visibility: PostVisibility.ONLY_ME }),
      makePost({ visibility: PostVisibility.UNLISTED }),
      makePost({ visibility: PostVisibility.PROFILE_ONLY }),
      makePost({ content: '' }),
      makePost({ content: '[Encrypted Content]' }),
    ]) {
      service.federatePostUpdate(post, 'user-1');
    }
    await settle();

    // A post can be edited into a non-public state, so an edit needs the same
    // audience guard as the create did. A later enum member must not start
    // leaking either.
    expect(federationService.federateUpdate).not.toHaveBeenCalled();
  });

  it('logs rather than throws when the post was never federated', async () => {
    federationService.federateUpdate.mockResolvedValue({
      activityId: '',
      requested: 0,
      delivered: 0,
      failed: 0,
      results: [],
      skipped: true,
      reason: 'post was never federated, so there is nothing to update',
    });
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);

    await expect(
      new Promise<void>((resolve) => {
        service.federatePostUpdate(makePost(), 'user-1');
        resolve();
      }),
    ).resolves.toBeUndefined();
    await settle();
  });

  it('swallows a delivery failure', async () => {
    federationService.federateUpdate.mockRejectedValue(new Error('peer unreachable'));
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);

    // The edit is already saved and returned to the client; a dead peer must not
    // fail it.
    await expect(
      new Promise<void>((resolve) => {
        service.federatePostUpdate(makePost(), 'user-1');
        resolve();
      }),
    ).resolves.toBeUndefined();
    await settle();
    expect(federationService.federateUpdate).toHaveBeenCalled();
  });

  it('tolerates FederationService being absent', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'true' }, undefined);
    await expect(
      new Promise<void>((resolve) => {
        service.federatePostUpdate(makePost(), 'user-1');
        resolve();
      }),
    ).resolves.toBeUndefined();
    await settle();
  });
});

describe('federateNewPost — failure isolation', () => {
  it('swallows a delivery failure instead of rejecting', async () => {
    const federationService = {
      getFollowerInstanceDomains: jest.fn().mockResolvedValue(['mastodon.example']),
      federatePost: jest.fn().mockRejectedValue(new Error('peer unreachable')),
    };
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);

    // Post creation has already returned to the client by this point. A
    // third-party server being down must not roll back or delay a saved post.
    await expect(
      new Promise<void>((resolve) => {
        service.federateNewPost(makePost(), 'user-1');
        resolve();
      }),
    ).resolves.toBeUndefined();
    await settle();
    expect(federationService.federatePost).toHaveBeenCalled();
  });

  it('tolerates FederationService being absent from the container', async () => {
    const service = makeService({ FEDERATION_ENABLED: 'true' }, undefined);
    await expect(
      new Promise<void>((resolve) => {
        service.federateNewPost(makePost(), 'user-1');
        resolve();
      }),
    ).resolves.toBeUndefined();
    await settle();
  });

  it('tolerates a follower lookup that returns a non-array', async () => {
    const federationService = {
      getFollowerInstanceDomains: jest.fn().mockResolvedValue(undefined),
      federatePost: jest.fn(),
    };
    const service = makeService({ FEDERATION_ENABLED: 'true' }, federationService);

    service.federateNewPost(makePost(), 'user-1');
    await settle();

    expect(federationService.federatePost).not.toHaveBeenCalled();
  });
});
