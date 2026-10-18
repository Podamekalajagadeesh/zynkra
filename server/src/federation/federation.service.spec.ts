import axios from 'axios';
import { Logger } from '@nestjs/common';
import { FederationService } from './federation.service';

/**
 * Ported from `federation.service.test.js`, which used `node:test` inside a Jest
 * project whose `testMatch` is `['**\/*.spec.ts', '**\/*.test.ts']` and whose
 * `testPathIgnorePatterns` excluded `/src/federation/`. Nothing ever collected it,
 * so it had never been executed once.
 *
 * It would also have failed if it had run: it constructs the service with 6
 * arguments, but the constructor now takes 8 (`moderationRepository` was inserted
 * at #4 and `httpSignaturesService` appended at #8), so every argument from #4 on
 * was bound to the wrong dependency. It also never stubbed `axios.get`, so
 * `fetchRemoteUser` would have attempted real network calls. Both are fixed here.
 *
 * `new (FederationService as any)(...)` is deliberate: the whole point of these
 * tests is to pin the *runtime* argument order, and casting keeps the helper from
 * re-breaking silently if the ctor changes again.
 */
jest.mock('../users/users.service', () => ({ UsersService: class UsersService {} }));
jest.mock('../posts/posts.service', () => ({ PostsService: class PostsService {} }));

const INSTANCE = { id: 'instance-1', domain: 'example.com', baseUrl: 'https://example.com' };

const ACTOR_JSON = {
  preferredUsername: 'alice',
  name: 'Alice',
  summary: '',
  inbox: 'https://example.com/users/alice/inbox',
  outbox: 'https://example.com/users/alice/outbox',
  followers: 'https://example.com/users/alice/followers',
  following: 'https://example.com/users/alice/following',
};

const NODEINFO_JSON = {
  software: { name: 'mastodon', version: '4.3.0' },
  metadata: { nodeName: 'Example' },
};

const NODEINFO_LINKS = {
  links: [
    {
      rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
      href: 'https://example.com/nodeinfo/2.0',
    },
  ],
};

type Harness = {
  service: any;
  instanceRepository: any;
  remoteUserRepository: any;
  remotePostRepository: any;
  moderationRepository: any;
  followRepository: any;
  outboxRepository: any;
  userService: any;
  postsService: any;
  httpSignaturesService: any;
  createdPosts: any[];
  savedUsers: any[];
  savedInstances: any[];
  /** Rows written to the outbound-activity ledger. */
  outboxRows: any[];
  /** Rows the ledger lookup returns, in order. */
  outboxLookup: any[];
};

function createService(
  options: {
    federationEnabled?: boolean;
    instanceRepository?: any;
  } = {},
): Harness {
  const federationEnabled = options.federationEnabled ?? false;

  const createdPosts: any[] = [];
  const savedUsers: any[] = [];
  const savedInstances: any[] = [];

  const instanceRepository = options.instanceRepository ?? {
    findOne: jest.fn().mockResolvedValue(INSTANCE),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => {
      savedInstances.push(data);
      return { ...data, id: 'instance-1' };
    }),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const remoteUserRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => {
      savedUsers.push(data);
      return { ...data, id: 'remote-user-1' };
    }),
    count: jest.fn().mockResolvedValue(0),
  };

  const remotePostRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((data: any) => {
      createdPosts.push(data);
      return data;
    }),
    save: jest.fn(async (data: any) => ({ ...data, id: 'remote-post-1' })),
    remove: jest.fn().mockResolvedValue(undefined),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  };

  const moderationRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => data),
    find: jest.fn().mockResolvedValue([]),
  };

  const followRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => data),
    remove: jest.fn(async (data: any) => data),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  };

  /**
   * The outbound activity ledger.
   *
   * `outboxLookup` is what `findOutboundActivity` returns, and it is *not* the
   * same array as `outboxRows`. The bug this table replaces was a write that
   * stored one identifier and a read that looked up a different one, which no
   * amount of stubbing would have caught: the old test mocked `findOne` to
   * return a matching row instead of round-tripping a real `federatePost` into
   * a real `federateDelete`. `outbox.federation.spec.ts` now does that
   * round-trip, so the lookup key and the write key are the same string by
   * construction.
   */
  const outboxRows: any[] = [];
  const outboxLookup: any[] = [];
  const outboxRepository = {
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => {
      outboxRows.push(data);
      return { ...data, id: 'outbox-1' };
    }),
    findOne: jest.fn(async ({ where }: any) => {
      const match = outboxLookup.find(
        (row) => row.objectId === where.objectId && row.activityType === where.activityType,
      );
      return match ?? null;
    }),
    find: jest.fn().mockResolvedValue([]),
  };

  const configService = {
    get: (key: string, fallback?: any) => {
      if (key === 'FEDERATION_ENABLED') return federationEnabled ? 'true' : 'false';
      return fallback ?? null;
    },
  };

  const userService = {
    findOneById: jest.fn().mockResolvedValue({ id: 'user-1', username: 'localuser' }),
    findByUsername: jest.fn().mockResolvedValue({ id: 'user-1', username: 'localuser' }),
  };

  const postsService = {
    findPostsByUserId: jest.fn().mockResolvedValue([]),
  };

  const httpSignaturesService = {
    getSignedPostHeaders: jest.fn(() => ({
      'Content-Type': 'application/activity+json',
      Signature: 'keyId="https://zynkra.test/federation/users/local#main-key"',
    })),
    getSignedGetHeaders: jest.fn(() => ({ Accept: 'application/activity+json' })),
    getPublicKeyPem: jest.fn(() => 'PEM'),
  };

  const service = new (FederationService as any)(
    instanceRepository,
    remoteUserRepository,
    remotePostRepository,
    moderationRepository,
    followRepository,
    outboxRepository,
    configService,
    userService,
    postsService,
    httpSignaturesService,
  );

  return {
    service,
    instanceRepository,
    remoteUserRepository,
    remotePostRepository,
    moderationRepository,
    followRepository,
    outboxRepository,
    userService,
    postsService,
    httpSignaturesService,
    createdPosts,
    savedUsers,
    savedInstances,
    outboxRows,
    outboxLookup,
  };
}

let getSpy: jest.SpyInstance;
let postSpy: jest.SpyInstance;

beforeAll(() => {
  Logger.overrideLogger(false);
});

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  // `jest.spyOn` calls through by default, so an unstubbed request would reach
  // the real network. Both default to rejecting instead.
  getSpy = jest
    .spyOn(axios as any, 'get')
    .mockImplementation(() => Promise.reject(new Error('axios.get called without a stub')));
  postSpy = jest
    .spyOn(axios as any, 'post')
    .mockImplementation(() => Promise.reject(new Error('axios.post called without a stub')));
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

function mockGet(routes: Record<string, any>) {
  getSpy.mockImplementation(async (url: string) => {
    const match = Object.keys(routes).find((key) => url.includes(key));
    if (!match) throw new Error(`Unexpected GET ${url}`);
    return { data: routes[match] };
  });
}

describe('processSharedInbox — Create', () => {
  it('persists an incoming Note and returns the persisted id', async () => {
    mockGet({
      '/users/alice': ACTOR_JSON,
      '/.well-known/nodeinfo': NODEINFO_LINKS,
      '/nodeinfo/2.0': NODEINFO_JSON,
      '/.well-known/webfinger': { subject: 'acct:local@example.com' },
    });

    const { service, createdPosts } = createService();

    const result = await service.processSharedInbox({
      type: 'Create',
      actor: 'https://example.com/users/alice',
      object: {
        id: 'https://example.com/posts/1',
        type: 'Note',
        content: 'Hello federation',
        published: '2026-07-04T00:00:00.000Z',
        attributedTo: 'https://example.com/users/alice',
      },
    });

    expect(result.success).toBe(true);
    expect(createdPosts).toHaveLength(1);
    expect(createdPosts[0].content).toBe('Hello federation');
    expect(createdPosts[0].activityId).toBe('https://example.com/posts/1');
    expect(createdPosts[0].publishedAt).toEqual(new Date('2026-07-04T00:00:00.000Z'));
    expect(result.persistedPostId).toBe('remote-post-1');
  });

  it('still persists when the remote author cannot be resolved', async () => {
    mockGet({ '/.well-known/nodeinfo': NODEINFO_LINKS, '/nodeinfo/2.0': NODEINFO_JSON });

    const { service, createdPosts } = createService();

    const result = await service.processSharedInbox({
      type: 'Create',
      actor: 'https://example.com/users/ghost',
      object: { id: 'https://example.com/posts/9', type: 'Note', content: 'Orphan post' },
    });

    expect(result.success).toBe(true);
    expect(createdPosts).toHaveLength(1);
    expect(createdPosts[0].author).toBeNull();
  });
});

describe('processSharedInbox — Follow', () => {
  it('sends an unsigned Accept when federation is disabled', async () => {
    mockGet({ '/users/alice': ACTOR_JSON });
    postSpy.mockResolvedValue({ status: 202 });

    const { service, httpSignaturesService } = createService({ federationEnabled: false });

    const result = await service.processSharedInbox({
      type: 'Follow',
      actor: 'https://example.com/users/alice',
      object: 'https://example.com/users/bob',
    });

    expect(result.success).toBe(true);
    expect(result.accepted).toBe(true);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(httpSignaturesService.getSignedPostHeaders).not.toHaveBeenCalled();

    const [url, body] = postSpy.mock.calls[0];
    expect(url).toBe('https://example.com/users/alice/inbox');
    expect(body.type).toBe('Accept');
    expect(body.object.type).toBe('Follow');
  });

  it('persists the follow before replying Accept', async () => {
    mockGet({ '/users/alice': ACTOR_JSON });
    postSpy.mockResolvedValue({ status: 202 });

    const { service, followRepository, userService } = createService({ federationEnabled: true });
    userService.findByUsername.mockResolvedValue({ id: 'user-1', username: 'localuser' });

    await service.processSharedInbox({
      id: 'https://example.com/activities/follow-1',
      type: 'Follow',
      actor: 'https://example.com/users/alice',
      object: 'http://localhost:3001/federation/users/localuser',
    });

    // Previously the Accept went out and the relationship was discarded, so the
    // remote server believed it was followed while this instance held no record.
    expect(followRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        localUser: { id: 'user-1' },
        remoteUser: { id: 'remote-user-1' },
        followActivityId: 'https://example.com/activities/follow-1',
      }),
    );
    expect(followRepository.save).toHaveBeenCalledTimes(1);
  });

  it('accepts a Follow addressed by bare username', async () => {
    mockGet({ '/users/alice': ACTOR_JSON });
    postSpy.mockResolvedValue({ status: 202 });

    const { service, followRepository, userService } = createService({ federationEnabled: true });
    userService.findByUsername.mockResolvedValue({ id: 'user-1', username: 'localuser' });

    await service.processSharedInbox({
      type: 'Follow',
      actor: 'https://example.com/users/alice',
      object: 'localuser',
    });

    expect(followRepository.save).toHaveBeenCalledTimes(1);
  });

  it('is idempotent for a replayed Follow', async () => {
    mockGet({ '/users/alice': ACTOR_JSON });
    postSpy.mockResolvedValue({ status: 202 });

    const { service, followRepository, userService } = createService({ federationEnabled: true });
    userService.findByUsername.mockResolvedValue({ id: 'user-1', username: 'localuser' });
    const existing = {
      id: 'follow-1',
      localUser: { id: 'user-1' },
      remoteUser: { id: 'remote-user-1' },
      followActivityId: 'old',
    };
    followRepository.findOne.mockResolvedValue(existing);

    await service.processSharedInbox({
      id: 'https://example.com/activities/follow-2',
      type: 'Follow',
      actor: 'https://example.com/users/alice',
      object: 'http://localhost:3001/federation/users/localuser',
    });

    // Mastodon re-sends Follow on reconnect. A blind insert would violate the
    // unique (localUser, remoteUser) constraint and throw inside the inbox.
    expect(followRepository.create).not.toHaveBeenCalled();
    expect(followRepository.save).toHaveBeenCalledWith(existing);
    expect(existing.followActivityId).toBe('https://example.com/activities/follow-2');
  });

  it('still sends Accept when the follow cannot be recorded', async () => {
    mockGet({ '/users/alice': ACTOR_JSON });
    postSpy.mockResolvedValue({ status: 202 });

    const { service, followRepository, userService } = createService({ federationEnabled: true });
    userService.findByUsername.mockResolvedValue({ id: 'user-1', username: 'localuser' });
    followRepository.save.mockRejectedValue(new Error('db down'));

    const result = await service.processSharedInbox({
      type: 'Follow',
      actor: 'https://example.com/users/alice',
      object: 'http://localhost:3001/federation/users/localuser',
    });

    // A bookkeeping failure must not fail the inbox; the remote actor still
    // needs its Accept or it will retry forever.
    expect(result.accepted).toBe(true);
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('does not record a follow for an unknown local actor', async () => {
    mockGet({ '/users/alice': ACTOR_JSON });
    postSpy.mockResolvedValue({ status: 202 });

    const { service, followRepository, userService } = createService({ federationEnabled: true });
    userService.findByUsername.mockResolvedValue(null);

    await service.processSharedInbox({
      type: 'Follow',
      actor: 'https://example.com/users/alice',
      object: 'http://localhost:3001/federation/users/ghost',
    });

    expect(followRepository.save).not.toHaveBeenCalled();
  });

  it('signs the Accept body when federation is enabled', async () => {
    mockGet({ '/users/alice': ACTOR_JSON });
    postSpy.mockResolvedValue({ status: 202 });

    const { service, httpSignaturesService } = createService({ federationEnabled: true });

    await service.processSharedInbox({
      type: 'Follow',
      actor: 'https://example.com/users/alice',
      object: 'https://example.com/users/bob',
    });

    expect(httpSignaturesService.getSignedPostHeaders).toHaveBeenCalledTimes(1);
    const [actorUrl, body, inboxUrl] =
      httpSignaturesService.getSignedPostHeaders.mock.calls[0];
    expect(actorUrl).toBe('http://localhost:3001/federation/users/local');
    expect(inboxUrl).toBe('https://example.com/users/alice/inbox');
    expect(typeof body).toBe('string');
    expect(JSON.parse(body).type).toBe('Accept');
  });
});

describe('processSharedInbox — other activity types', () => {
  it('rejects an activity with no type', async () => {
    const { service } = createService();
    const result = await service.processSharedInbox({});
    expect(result).toEqual({ success: false, received: false, reason: 'Missing activity type' });
  });

  it('increments likeCount for a known post', async () => {
    const existing = { id: 'remote-post-1', activityId: 'https://example.com/posts/1', likeCount: 0 };
    const { service, remotePostRepository } = createService();
    remotePostRepository.findOne.mockResolvedValue(existing);

    const result = await service.processSharedInbox({
      type: 'Like',
      actor: 'https://example.com/users/alice',
      object: 'https://example.com/posts/1',
    });

    expect(result.status).toBe('like-recorded');
    expect(existing.likeCount).toBe(1);
    expect(remotePostRepository.save).toHaveBeenCalledWith(existing);
  });

  it('increments shareCount for an Announce', async () => {
    const existing = { id: 'remote-post-1', activityId: 'https://example.com/posts/1', shareCount: 0 };
    const { service, remotePostRepository } = createService();
    remotePostRepository.findOne.mockResolvedValue(existing);

    const result = await service.processSharedInbox({
      type: 'Announce',
      actor: 'https://example.com/users/alice',
      object: 'https://example.com/posts/1',
    });

    expect(result.status).toBe('announce-recorded');
    expect(existing.shareCount).toBe(1);
  });

  it('removes the post on Delete', async () => {
    const existing = { id: 'remote-post-1', activityId: 'https://example.com/posts/1' };
    const { service, remotePostRepository } = createService();
    remotePostRepository.findOne.mockResolvedValue(existing);

    const result = await service.processSharedInbox({
      type: 'Delete',
      actor: 'https://example.com/users/alice',
      object: 'https://example.com/posts/1',
    });

    expect(result.status).toBe('delete-processed');
    expect(remotePostRepository.remove).toHaveBeenCalledWith(existing);
  });

  it('applies a content change on Update', async () => {
    const existing = {
      id: 'remote-post-1',
      activityId: 'https://example.com/posts/1',
      content: 'old text',
    };
    const { service, remotePostRepository } = createService();
    remotePostRepository.findOne.mockResolvedValue(existing);

    const result = await service.processSharedInbox({
      type: 'Update',
      actor: 'https://example.com/users/alice',
      object: { id: 'https://example.com/posts/1', content: 'edited text' },
    });

    expect(result.status).toBe('update-processed');
    expect(existing.content).toBe('edited text');
  });

  it('removes an inbound follow on Undo (Follow)', async () => {
    const { service, followRepository, userService, remoteUserRepository } = createService();
    userService.findByUsername.mockResolvedValue({ id: 'user-1', username: 'localuser' });
    remoteUserRepository.findOne.mockResolvedValue({ id: 'remote-user-1' });
    const existing = { id: 'follow-1', localUser: { id: 'user-1' }, remoteUser: { id: 'remote-user-1' } };
    followRepository.findOne.mockResolvedValue(existing);

    const result = await service.processSharedInbox({
      type: 'Undo',
      actor: 'https://example.com/users/alice',
      object: {
        type: 'Follow',
        actor: 'https://example.com/users/alice',
        object: 'http://localhost:3001/federation/users/localuser',
      },
    });

    // Previously returned `follow-undo-processed` without touching the database,
    // so a remote user who unfollowed stayed a follower forever.
    expect(result.status).toBe('follow-undo-processed');
    expect(followRepository.remove).toHaveBeenCalledWith(existing);
  });

  it('reports a no-op when the Undo targets an unknown follow', async () => {
    const { service, followRepository, userService, remoteUserRepository } = createService();
    userService.findByUsername.mockResolvedValue({ id: 'user-1', username: 'localuser' });
    remoteUserRepository.findOne.mockResolvedValue({ id: 'remote-user-1' });
    followRepository.findOne.mockResolvedValue(null);

    const result = await service.processSharedInbox({
      type: 'Undo',
      object: {
        type: 'Follow',
        actor: 'https://example.com/users/alice',
        object: 'http://localhost:3001/federation/users/localuser',
      },
    });

    // Distinguishing "removed" from "was not there" matters: a no-op that
    // reports success is indistinguishable from a successful removal.
    expect(result.status).toBe('follow-undo-noop');
    expect(followRepository.remove).not.toHaveBeenCalled();
  });

  it('ignores a Undo for a non-Follow activity', async () => {
    const { service, remotePostRepository, followRepository } = createService();
    const result = await service.processSharedInbox({
      type: 'Undo',
      object: { type: 'Like', object: 'https://example.com/posts/1' },
    });

    expect(result.status).toBe('undo-processed');
    expect(remotePostRepository.save).not.toHaveBeenCalled();
    expect(remotePostRepository.remove).not.toHaveBeenCalled();
    expect(followRepository.remove).not.toHaveBeenCalled();
  });
});

describe('fetchRemoteUser', () => {
  it('stores a remote actor and its instance', async () => {
    mockGet({
      '/users/alice': ACTOR_JSON,
      '/.well-known/nodeinfo': NODEINFO_LINKS,
      '/nodeinfo/2.0': NODEINFO_JSON,
      '/.well-known/webfinger': { subject: 'acct:local@example.com' },
    });

    const { service, savedInstances, savedUsers } = createService({
      instanceRepository: {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((data: any) => data),
        save: jest.fn(async (data: any) => {
          savedInstances.push(data);
          return { ...data, id: 'instance-1' };
        }),
      },
    });

    const user = await service.fetchRemoteUser('https://example.com/users/alice');

    expect(user.username).toBe('alice');
    expect(user.inboxUrl).toBe('https://example.com/users/alice/inbox');
    expect(savedUsers).toHaveLength(1);
    expect(savedInstances).toHaveLength(1);
    expect(savedInstances[0].domain).toBe('example.com');
    expect(savedInstances[0].software).toBe('mastodon');
  });

  it('returns the cached actor without refetching', async () => {
    const cached = { id: 'remote-user-9', actorId: 'https://example.com/users/alice' };
    const { service, remoteUserRepository } = createService();
    remoteUserRepository.findOne.mockResolvedValue(cached);

    const user = await service.fetchRemoteUser('https://example.com/users/alice');

    expect(user).toBe(cached);
    expect(getSpy).not.toHaveBeenCalled();
  });
});

describe('fetchRemotePost', () => {
  it('persists a remote note even when the author lookup fails', async () => {
    getSpy.mockImplementation(async (url: string) => {
      if (url === 'https://example.com/posts/42') {
        return {
          data: {
            type: 'Create',
            actor: 'https://example.com/users/alice',
            object: {
              id: 'https://example.com/posts/42',
              content: 'Remote note',
              published: '2026-07-05T00:00:00.000Z',
            },
          },
        };
      }
      if (url === 'https://example.com/users/alice') throw new Error('actor unavailable');
      throw new Error(`Unexpected GET ${url}`);
    });

    const { service, createdPosts } = createService();

    const post = await service.fetchRemotePost('https://example.com/posts/42');

    expect(post.content).toBe('Remote note');
    expect(createdPosts).toHaveLength(1);
    expect(createdPosts[0].publishedAt).toEqual(new Date('2026-07-05T00:00:00.000Z'));
  });

  it('returns the cached post without refetching', async () => {
    const cached = { id: 'remote-post-1', activityId: 'https://example.com/posts/42' };
    const { service, remotePostRepository } = createService();
    remotePostRepository.findOne.mockResolvedValue(cached);

    const post = await service.fetchRemotePost('https://example.com/posts/42');

    expect(post).toBe(cached);
    expect(getSpy).not.toHaveBeenCalled();
  });
});

describe('probeInteroperability', () => {
  it('reports compatibility for a Mastodon-style instance', async () => {
    mockGet({
      '/.well-known/nodeinfo': NODEINFO_LINKS,
      '/nodeinfo/2.0': NODEINFO_JSON,
      '/.well-known/webfinger': { subject: 'acct:local@mastodon.example' },
    });

    const { service } = createService();

    const result = await service.probeInteroperability('mastodon.example');

    expect(result.compatible).toBe(true);
    expect(result.software).toBe('mastodon');
    expect(result.version).toBe('4.3.0');
    expect(result.capabilities).toEqual(['inbox', 'outbox', 'nodeinfo', 'webfinger']);
    expect(result.errors).toEqual([]);
    expect(result.domain).toBe('mastodon.example');
  });

  it('records webfinger-unavailable without failing the probe', async () => {
    getSpy.mockImplementation(async (url: string) => {
      if (url.includes('/.well-known/webfinger')) throw new Error('no webfinger');
      if (url.includes('/.well-known/nodeinfo')) return { data: NODEINFO_LINKS };
      if (url.includes('/nodeinfo/2.0')) return { data: NODEINFO_JSON };
      throw new Error(`Unexpected GET ${url}`);
    });

    const { service } = createService();
    const result = await service.probeInteroperability('mastodon.example');

    expect(result.compatible).toBe(true);
    expect(result.capabilities).not.toContain('webfinger');
    expect(result.errors).toEqual(['webfinger-unavailable']);
  });

  it('returns compatible:false when the instance is unreachable', async () => {
    getSpy.mockRejectedValue(new Error('ECONNREFUSED'));

    const { service } = createService();
    const result = await service.probeInteroperability('dead.example');

    expect(result.compatible).toBe(false);
    expect(result.capabilities).toEqual([]);
    expect(result.errors).toEqual(['ECONNREFUSED']);
  });
});

describe('deliverToInbox', () => {
  it('retries after a transient failure and succeeds', async () => {
    let attempts = 0;
    postSpy.mockImplementation(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('temporary outage');
      return { status: 202 };
    });

    const { service, httpSignaturesService } = createService();

    const result = await service.deliverToInbox(
      { baseUrl: 'https://example.com' },
      { type: 'Create' },
      { retryDelayMs: 0 },
    );

    expect(attempts).toBe(2);
    expect(result).toEqual({ delivered: true, attempts: 2 });
    expect(httpSignaturesService.getSignedPostHeaders).toHaveBeenCalledWith(
      'http://localhost:3001/federation/users/local',
      JSON.stringify({ type: 'Create' }),
      'https://example.com/inbox',
    );
  });

  it('re-signs on each attempt so the Date header cannot go stale', async () => {
    let attempts = 0;
    postSpy.mockImplementation(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('temporary outage');
      return { status: 202 };
    });

    const { service, httpSignaturesService } = createService();

    await service.deliverToInbox(
      { baseUrl: 'https://example.com' },
      { type: 'Create' },
      { retryDelayMs: 0 },
    );

    // Signing once before the loop would leave a retry carrying the original
    // Date, which a peer enforcing clock skew rejects — the retry would fail
    // *because* it retried.
    expect(httpSignaturesService.getSignedPostHeaders).toHaveBeenCalledTimes(2);
  });

  it('gives up after maxAttempts and rethrows the last error', async () => {
    postSpy.mockRejectedValue(new Error('permanent outage'));

    const { service } = createService();

    await expect(
      service.deliverToInbox(
        { baseUrl: 'https://example.com' },
        { type: 'Create' },
        { maxAttempts: 3, retryDelayMs: 0 },
      ),
    ).rejects.toThrow('permanent outage');

    expect(postSpy).toHaveBeenCalledTimes(3);
  });

  it('does not retry a 401 signature rejection', async () => {
    postSpy.mockRejectedValue({ response: { status: 401 } });

    const { service } = createService();
    const result = await service.deliverToInbox(
      { baseUrl: 'https://example.com' },
      { type: 'Create' },
      { retryDelayMs: 0 },
    );

    // A rejected signature is deterministic; resending identical bytes just
    // triples the load on a peer that will refuse every attempt.
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(result.delivered).toBe(false);
    expect(result.attempts).toBe(1);
    expect(result.status).toBe(401);
    expect(result.retryable).toBe(false);
  });

  it('does not retry a 403', async () => {
    postSpy.mockRejectedValue({ response: { status: 403 } });
    const { service } = createService();

    const result = await service.deliverToInbox(
      { baseUrl: 'https://example.com' },
      { type: 'Create' },
      { retryDelayMs: 0 },
    );

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(403);
  });

  it('does not retry a non-retryable 4xx such as 400', async () => {
    postSpy.mockRejectedValue({ response: { status: 400 } });
    const { service } = createService();

    const result = await service.deliverToInbox(
      { baseUrl: 'https://example.com' },
      { type: 'Create' },
      { retryDelayMs: 0 },
    );

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(result.retryable).toBe(false);
    expect(result.reason).toContain('400');
  });

  it('does retry a 429, which is explicitly retryable', async () => {
    let attempts = 0;
    postSpy.mockImplementation(async () => {
      attempts += 1;
      if (attempts === 1) {
        const error: any = new Error('Too Many Requests');
        error.response = { status: 429 };
        throw error;
      }
      return { status: 202 };
    });

    const { service } = createService();
    const result = await service.deliverToInbox(
      { baseUrl: 'https://example.com' },
      { type: 'Create' },
      { retryDelayMs: 0 },
    );

    expect(attempts).toBe(2);
    expect(result.delivered).toBe(true);
  });

  it('retries a 5xx', async () => {
    let attempts = 0;
    postSpy.mockImplementation(async () => {
      attempts += 1;
      if (attempts === 1) {
        const error: any = new Error('Bad Gateway');
        error.response = { status: 502 };
        throw error;
      }
      return { status: 202 };
    });

    const { service } = createService();
    await service.deliverToInbox(
      { baseUrl: 'https://example.com' },
      { type: 'Create' },
      { retryDelayMs: 0 },
    );

    expect(attempts).toBe(2);
  });

  it('skips an instance with no baseUrl', async () => {
    const { service } = createService();

    const result = await service.deliverToInbox({}, { type: 'Create' });

    expect(postSpy).not.toHaveBeenCalled();
    expect(result).toEqual({
      delivered: false,
      skipped: true,
      reason: 'instance has no baseUrl',
    });
  });

  it('signs as the named actor when one is supplied', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, httpSignaturesService } = createService();

    await service.deliverToInbox(
      { baseUrl: 'https://example.com' },
      { type: 'Create' },
      { actorUsername: 'alice' },
    );

    expect(httpSignaturesService.getSignedPostHeaders).toHaveBeenCalledWith(
      'http://localhost:3001/federation/users/alice',
      JSON.stringify({ type: 'Create' }),
      'https://example.com/inbox',
    );
  });
});

describe('federateDelete', () => {
  it('sends a Delete referencing the original activity id', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, outboxLookup } = createService({ federationEnabled: true });
    outboxLookup.push({
      activityId: 'http://localhost:3001/federation/activities/abc-123',
      objectId: 'http://localhost:3001/federation/posts/post-1',
      activityType: 'Create',
      deliveredTo: ['example.com'],
    });

    const report = await service.federateDelete('user-1', 'post-1', ['example.com']);

    expect(report.delivered).toBe(1);
    const activity = JSON.parse(postSpy.mock.calls[0][1]);
    // ActivityPub models this as Delete wrapping a Tombstone whose id is the
    // original Create activity's id — not the Note id.
    expect(activity.type).toBe('Delete');
    expect(activity.object.type).toBe('Tombstone');
    expect(activity.object.formerType).toBe('Note');
    expect(activity.object.id).toBe('http://localhost:3001/federation/activities/abc-123');
  });

  it('retracts from the instances that accepted the Create', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, outboxLookup, instanceRepository } = createService({
      federationEnabled: true,
    });
    outboxLookup.push({
      activityId: 'http://localhost:3001/federation/activities/abc-123',
      objectId: 'http://localhost:3001/federation/posts/post-1',
      activityType: 'Create',
      // The author has since unfollowed `old.example` but a new follower joined
      // `new.example`. Retracting from the current follower list would leave a
      // stale copy on `old.example` forever.
      deliveredTo: ['old.example'],
    });
    instanceRepository.findOne.mockImplementation(async ({ where }: any) =>
      where.domain === 'old.example' ? INSTANCE : null,
    );

    const report = await service.federateDelete('user-1', 'post-1', ['new.example']);

    expect(postSpy.mock.calls[0][0]).toBe('https://example.com/inbox');
    expect(report.delivered).toBe(1);
  });

  it('emits nothing when the post was never federated', async () => {
    const { service } = createService({ federationEnabled: true });

    const report = await service.federateDelete('user-1', 'post-1', ['example.com']);

    // A Delete for an activity the peer never received is noise, not correctness.
    expect(postSpy).not.toHaveBeenCalled();
    expect(report.skipped).toBe(true);
    expect(report.reason).toContain('no recorded federated activity');
  });

  it('refuses to delete while federation is disabled', async () => {
    const { service } = createService({ federationEnabled: false });
    await expect(service.federateDelete('user-1', 'post-1', ['example.com'])).rejects.toThrow(
      'Outbound federation is disabled',
    );
  });
});

describe('federateAnnounce', () => {
  it('announces the remote activity id to the author, not to local followers', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, remotePostRepository } = createService({ federationEnabled: true });
    remotePostRepository.findOne.mockResolvedValue({
      activityId: 'https://example.com/posts/1',
      author: {
        actorId: 'https://example.com/users/alice',
        inboxUrl: 'https://example.com/users/alice/inbox',
      },
      instance: { domain: 'example.com' },
    });

    const report = await service.federateAnnounce('user-1', 'https://example.com/posts/1');

    expect(report.delivered).toBe(1);
    const activity = JSON.parse(postSpy.mock.calls[0][1]);
    expect(activity.type).toBe('Announce');
    // Sending the Note itself would duplicate it as a new post, not a boost.
    expect(activity.object).toBe('https://example.com/posts/1');
    // Addressed to the author of the boosted object, not broadcast publicly.
    expect(activity.to).toEqual(['https://example.com/users/alice']);
    expect(postSpy.mock.calls[0][0]).toBe('https://example.com/users/alice/inbox');
  });

  it('records the Announce so it can be undone', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, remotePostRepository, outboxRows } = createService({
      federationEnabled: true,
    });
    remotePostRepository.findOne.mockResolvedValue({
      activityId: 'https://example.com/posts/1',
      author: {
        actorId: 'https://example.com/users/alice',
        inboxUrl: 'https://example.com/users/alice/inbox',
      },
      instance: { domain: 'example.com' },
    });

    await service.federateAnnounce('user-1', 'https://example.com/posts/1');

    expect(outboxRows).toHaveLength(1);
    expect(outboxRows[0].activityType).toBe('Announce');
    expect(outboxRows[0].objectId).toBe('https://example.com/posts/1');
  });

  it('skips when the remote object is unknown', async () => {
    const { service, remotePostRepository } = createService({ federationEnabled: true });
    remotePostRepository.findOne.mockResolvedValue(null);
    getSpy.mockRejectedValue(new Error('unreachable'));

    const report = await service.federateAnnounce('user-1', 'https://example.com/posts/1');

    expect(postSpy).not.toHaveBeenCalled();
    expect(report.skipped).toBe(true);
  });
});

describe('getFederatedTimeline', () => {
  const remotePost = (overrides: any = {}) => ({
    id: 'rp-1',
    activityId: 'https://example.com/posts/1',
    content: 'remote hello',
    publishedAt: new Date('2026-09-01T00:00:00.000Z'),
    inReplyToId: null,
    mediaUrls: [],
    mentions: [],
    tags: [],
    likeCount: 0,
    shareCount: 0,
    author: { id: 'ru-1', actorId: 'https://example.com/users/alice', username: 'alice', name: 'Alice', avatarUrl: null },
    instance: { id: 'i-1', domain: 'example.com', baseUrl: 'https://example.com', software: 'mastodon' },
    ...overrides,
  });

  function stubQuery(posts: any[], total = posts.length) {
    return {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([posts, total]),
    };
  }

  it('normalizes a stored remote post for display', async () => {
    const { service, remotePostRepository } = createService();
    remotePostRepository.createQueryBuilder = jest.fn(() => stubQuery([remotePost()]));

    const result = await service.getFederatedTimeline(null);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      id: 'https://example.com/posts/1',
      content: 'remote hello',
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      inReplyToId: null,
      mediaUrls: [],
      mentions: [],
      tags: [],
      likeCount: 0,
      shareCount: 0,
      isFederated: true,
      author: {
        actorId: 'https://example.com/users/alice',
        username: 'alice',
        name: 'Alice',
        avatarUrl: null,
      },
      instance: { domain: 'example.com', baseUrl: 'https://example.com', software: 'mastodon' },
    });
  });

  it('excludes rows with no author or instance', async () => {
    const { service, remotePostRepository } = createService();
    const qb = stubQuery([]);
    remotePostRepository.createQueryBuilder = jest.fn(() => qb);

    await service.getFederatedTimeline(null);

    // Defence in depth. `federatePost` used to write its outbound bookkeeping
    // into this table, and those rows had no author and no instance, so the
    // filter below is what kept authorless ghosts out of the feed. Outbound
    // bookkeeping now lives in `federation_outbox`, but the filter stays: a
    // half-resolved remote post must not render as content either.
    expect(qb.where).toHaveBeenCalledWith('author.id IS NOT NULL');
    expect(qb.andWhere).toHaveBeenCalledWith('instance.id IS NOT NULL');
  });

  it('clamps limit to 1..50 and floors offset at 0', async () => {
    const { service, remotePostRepository } = createService();
    const qb = stubQuery([]);
    remotePostRepository.createQueryBuilder = jest.fn(() => qb);

    await service.getFederatedTimeline(null, { limit: 9999, offset: -5 });
    expect(qb.take).toHaveBeenCalledWith(50);
    expect(qb.skip).toHaveBeenCalledWith(0);

    await service.getFederatedTimeline(null, { limit: 0 });
    expect(qb.take).toHaveBeenCalledWith(1);
  });

  it('returns every post to an anonymous viewer', async () => {
    const { service, remotePostRepository, moderationRepository } = createService();
    remotePostRepository.createQueryBuilder = jest.fn(() => stubQuery([remotePost()]));

    const result = await service.getFederatedTimeline(null);

    // No viewer means no personal moderation state to apply.
    expect(moderationRepository.find).not.toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
  });

  it('drops posts from a remote user the viewer blocked', async () => {
    const { service, remotePostRepository, moderationRepository } = createService();
    remotePostRepository.createQueryBuilder = jest.fn(() =>
      stubQuery([remotePost(), remotePost({ id: 'rp-2', author: { id: 'ru-2', actorId: 'x', username: 'bob' } })]),
    );
    moderationRepository.find.mockResolvedValue([
      { isBlocked: true, isMuted: false, remoteUser: { id: 'ru-1' } },
    ]);

    const result = await service.getFederatedTimeline('user-1');

    // A block that did not cover the federated timeline would be a moderation
    // bypass on the one surface where it is most obviously expected.
    expect(result.items.map((i) => i.author.actorId)).toEqual(['x']);
  });

  it('hides muted remote users unless includeMuted is set', async () => {
    const { service, remotePostRepository, moderationRepository } = createService();
    remotePostRepository.createQueryBuilder = jest.fn(() => stubQuery([remotePost()]));
    moderationRepository.find.mockResolvedValue([
      { isBlocked: false, isMuted: true, remoteUser: { id: 'ru-1' } },
    ]);

    expect((await service.getFederatedTimeline('user-1')).items).toHaveLength(0);
    expect((await service.getFederatedTimeline('user-1', { includeMuted: true })).items).toHaveLength(1);
  });

  it('drops posts from a blocked instance', async () => {
    const { service, remotePostRepository, moderationRepository, instanceRepository } =
      createService();
    remotePostRepository.createQueryBuilder = jest.fn(() => stubQuery([remotePost()]));
    moderationRepository.find.mockResolvedValue([]);
    instanceRepository.find.mockResolvedValue([{ domain: 'example.com' }]);

    expect((await service.getFederatedTimeline('user-1')).items).toHaveLength(0);
  });

  it('fails closed when the moderation lookup throws', async () => {
    const { service, remotePostRepository, moderationRepository } = createService();
    remotePostRepository.createQueryBuilder = jest.fn(() => stubQuery([remotePost()]));
    moderationRepository.find.mockRejectedValue(new Error('db down'));

    const result = await service.getFederatedTimeline('user-1');

    // Returning the page unfiltered would show a user content from accounts
    // they blocked. Showing nothing is the safe failure.
    expect(result.items).toEqual([]);
  });

  it('reports hasMore from the filtered count, not the raw total', async () => {
    const { service, remotePostRepository, moderationRepository } = createService();
    remotePostRepository.createQueryBuilder = jest.fn(() => stubQuery([remotePost()], 10));
    moderationRepository.find.mockResolvedValue([
      { isBlocked: true, isMuted: false, remoteUser: { id: 'ru-1' } },
    ]);

    const result = await service.getFederatedTimeline('user-1', { limit: 5, offset: 0 });

    // 10 stored, 5 shown after filtering, 0 consumed. offset + items < total
    // is what `hasMore` must be based on, or pagination reports phantom pages.
    expect(result.total).toBe(10);
    expect(result.items).toHaveLength(0);
    expect(result.hasMore).toBe(true);
  });
});

describe('sendFollow', () => {
  it('delivers a signed Follow to the target inbox', async () => {
    mockGet({ '/users/alice': ACTOR_JSON });
    postSpy.mockResolvedValue({ status: 202 });

    const { service, httpSignaturesService } = createService({ federationEnabled: true });

    const result = await service.sendFollow(
      { objectId: 'https://example.com/users/alice' } as any,
      'user-1',
    );

    expect(result.success).toBe(true);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0][0]).toBe('https://example.com/users/alice/inbox');

    // Signed as the local user, matching the activity's `actor`.
    expect(httpSignaturesService.getSignedPostHeaders).toHaveBeenCalledWith(
      'http://localhost:3001/federation/users/localuser',
      expect.any(String),
      'https://example.com/users/alice/inbox',
    );
    expect(JSON.parse(postSpy.mock.calls[0][1]).type).toBe('Follow');
  });

  it('retries a transient Follow failure', async () => {
    mockGet({ '/users/alice': ACTOR_JSON });
    let attempts = 0;
    postSpy.mockImplementation(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('temporary outage');
      return { status: 202 };
    });

    const { service } = createService({ federationEnabled: true });
    const result = await service.sendFollow(
      { objectId: 'https://example.com/users/alice' } as any,
      'user-1',
    );

    expect(attempts).toBe(2);
    expect(result.attempts).toBe(2);
  });

  it('reports the real reason when delivery is refused', async () => {
    mockGet({ '/users/alice': ACTOR_JSON });
    postSpy.mockRejectedValue({ response: { status: 401 } });

    const { service } = createService({ federationEnabled: true });

    // The old code caught every failure and returned a generic
    // "Failed to follow remote user", hiding a 401 that means the signature is
    // wrong — the single most likely misconfiguration.
    await expect(
      service.sendFollow({ objectId: 'https://example.com/users/alice' } as any, 'user-1'),
    ).rejects.toThrow(/signature rejected/);
  });
});

describe('federation guard', () => {
  it('refuses to federate a post when outbound federation is disabled', async () => {
    const { service } = createService({ federationEnabled: false });
    await expect(
      service.federatePost('user-1', { content: 'hi' } as any, ['example.com']),
    ).rejects.toThrow('Outbound federation is disabled');
  });

  it('refuses to send a follow when outbound federation is disabled', async () => {
    const { service } = createService({ federationEnabled: false });
    await expect(service.sendFollow({ objectId: 'https://example.com/users/alice' } as any, 'user-1')).rejects.toThrow(
      'Outbound federation is disabled',
    );
  });

  it('skips unconnected and blocked target instances instead of throwing', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, instanceRepository } = createService({ federationEnabled: true });
    instanceRepository.findOne.mockResolvedValue(null);

    const report = await service.federatePost('user-1', { content: 'hi' } as any, [
      'unknown.example',
    ]);

    expect(postSpy).not.toHaveBeenCalled();
    expect(report.delivered).toBe(0);
    expect(report.failed).toBe(1);
  });

  it('delivers to a connected instance when federation is enabled', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service } = createService({ federationEnabled: true });

    const report = await service.federatePost('user-1', { content: 'hi' } as any, [
      'example.com',
    ]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0][0]).toBe('https://example.com/inbox');
    expect(JSON.parse(postSpy.mock.calls[0][1]).type).toBe('Create');
    expect(report.delivered).toBe(1);
    expect(report.failed).toBe(0);
    expect(report.requested).toBe(1);
  });

  it('signs as the real author rather than the local placeholder', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, httpSignaturesService } = createService({ federationEnabled: true });

    await service.federatePost('user-1', { content: 'hi' } as any, ['example.com']);

    // A Mastodon-style peer checks that the signature keyId owner matches the
    // activity's `actor`. buildActivity claims `localuser`, so signing as
    // `local` would get the delivery 401'd.
    expect(httpSignaturesService.getSignedPostHeaders).toHaveBeenCalledWith(
      'http://localhost:3001/federation/users/localuser',
      expect.any(String),
      'https://example.com/inbox',
    );
  });

  it('reports blocked and unconnected instances instead of dropping them silently', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, instanceRepository } = createService({ federationEnabled: true });
    instanceRepository.findOne.mockResolvedValue(null);

    const report = await service.federatePost('user-1', { content: 'hi' } as any, [
      'blocked.example',
    ]);

    // Previously a bare `continue`: the caller could not tell a blocked instance
    // from a delivered one.
    expect(report.requested).toBe(1);
    expect(report.delivered).toBe(0);
    expect(report.failed).toBe(1);
    expect(report.results[0]).toEqual({
      domain: 'blocked.example',
      delivered: false,
      skipped: true,
      reason: 'instance is not connected or is blocked',
    });
  });

  it('gives the Note a stable id so a later Delete can reference it', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service } = createService({ federationEnabled: true });

    await service.federatePost(
      'user-1',
      { activityId: 'post-1', content: 'hi' } as any,
      ['example.com'],
    );

    const activity = JSON.parse(postSpy.mock.calls[0][1]);
    // A Delete references the *activity* id, so the Note must carry a stable
    // one derived from the post rather than an ephemeral timestamp.
    expect(activity.object.id).toBe('http://localhost:3001/federation/posts/post-1');
  });

  it('uses a unique activity id per activity, not a millisecond timestamp', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service } = createService({ federationEnabled: true });

    await service.federatePost('user-1', { activityId: 'a', content: '1' } as any, ['example.com']);
    await service.federatePost('user-1', { activityId: 'b', content: '2' } as any, ['example.com']);

    const first = JSON.parse(postSpy.mock.calls[0][1]).id;
    const second = JSON.parse(postSpy.mock.calls[1][1]).id;

    // Date.now() collides whenever two activities are built in the same tick,
    // and peers key dedup and reply threading off the activity id.
    expect(first).not.toBe(second);
  });

  it('records the activity id in the outbox after a successful delivery', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, outboxRows, remotePostRepository } = createService({ federationEnabled: true });

    await service.federatePost('user-1', { activityId: 'post-1', content: 'hi' } as any, [
      'example.com',
    ]);

    // Without this, a later Delete has no activity id to reference and the
    // federated copy can never be retracted. It belongs in the outbox keyed by
    // the Note id, not in `federated_posts` (an inbound-content table) keyed by
    // the activity id — see `federation-outbox.entity.ts`.
    expect(outboxRows).toHaveLength(1);
    expect(outboxRows[0].activityType).toBe('Create');
    expect(outboxRows[0].objectId).toBe('http://localhost:3001/federation/posts/post-1');
    expect(outboxRows[0].activityId).toContain('/federation/activities/');
    expect(outboxRows[0].deliveredTo).toEqual(['example.com']);

    // It must not leak into the federated timeline's read model.
    expect(remotePostRepository.create).not.toHaveBeenCalled();
  });

  it('still reports delivery when the activity id cannot be recorded', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, outboxRepository } = createService({ federationEnabled: true });
    outboxRepository.save.mockRejectedValue(new Error('db down'));

    const report = await service.federatePost(
      'user-1',
      { activityId: 'post-1', content: 'hi' } as any,
      ['example.com'],
    );

    // Losing the ability to retract is worse than nothing, but it must not
    // retroactively fail a delivery that already happened.
    expect(report.delivered).toBe(1);
  });

  it('reports a partial fan-out without throwing', async () => {
    postSpy.mockImplementation(async (url: string) => {
      if (url.includes('down.example')) {
        const error: any = new Error('ECONNREFUSED');
        error.response = { status: undefined };
        throw error;
      }
      return { status: 202 };
    });

    const { service, instanceRepository } = createService({ federationEnabled: true });
    instanceRepository.findOne.mockImplementation(async ({ where }: any) =>
      where.domain === 'down.example' ? null : INSTANCE,
    );

    const report = await service.federatePost('user-1', { content: 'hi' } as any, [
      'up.example',
      'down.example',
    ]);

    expect(report.requested).toBe(2);
    expect(report.delivered).toBe(1);
    expect(report.failed).toBe(1);
    expect(report.results.map((r: any) => r.domain)).toEqual(['up.example', 'down.example']);
    expect(report.activityId).toContain('/federation/activities/');
  });
});

describe('per-user remote moderation', () => {
  it('creates and saves a block row', async () => {
    const { service, moderationRepository, remoteUserRepository } = createService();
    remoteUserRepository.findOne.mockResolvedValue({ id: 'remote-user-1' });
    moderationRepository.findOne.mockResolvedValue({ isBlocked: false, isMuted: false });

    await service.blockRemoteUser('user-1', 'remote-user-1');

    expect(moderationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ isBlocked: true }),
    );
  });

  it('mutes without blocking', async () => {
    const { service, moderationRepository, remoteUserRepository } = createService();
    remoteUserRepository.findOne.mockResolvedValue({ id: 'remote-user-1' });
    moderationRepository.findOne.mockResolvedValue({ isBlocked: false, isMuted: false });

    await service.muteRemoteUser('user-1', 'remote-user-1');

    expect(moderationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ isMuted: true }),
    );
  });

  it('404s when the remote user does not exist', async () => {
    const { service, remoteUserRepository } = createService();
    remoteUserRepository.findOne.mockResolvedValue(null);

    await expect(service.blockRemoteUser('user-1', 'missing')).rejects.toThrow('Remote user not found');
  });

  it('unblocks and unmutes', async () => {
    const { service, moderationRepository, remoteUserRepository } = createService();
    remoteUserRepository.findOne.mockResolvedValue({ id: 'remote-user-1' });
    moderationRepository.findOne.mockResolvedValue({ isBlocked: true, isMuted: true });

    await service.unblockRemoteUser('user-1', 'remote-user-1');
    await service.unmuteRemoteUser('user-1', 'remote-user-1');

    expect(moderationRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ isBlocked: false, isMuted: false }),
    );
  });

  it('resolves distinct follower instance domains', async () => {
    const { service, followRepository } = createService();
    followRepository.find.mockResolvedValue([
      { remoteUser: { instance: { domain: 'mastodon.example' } } },
      { remoteUser: { instance: { domain: 'mastodon.example' } } },
      { remoteUser: { instance: { domain: 'pixelfed.example' } } },
    ]);

    expect(await service.getFollowerInstanceDomains('user-1')).toEqual([
      'mastodon.example',
      'pixelfed.example',
    ]);
  });

  it('ignores followers with no resolved instance', async () => {
    const { service, followRepository } = createService();
    followRepository.find.mockResolvedValue([
      { remoteUser: { instance: { domain: 'mastodon.example' } } },
      { remoteUser: { instance: null } },
      { remoteUser: null },
    ]);

    expect(await service.getFollowerInstanceDomains('user-1')).toEqual(['mastodon.example']);
  });

  it('returns an empty list when the lookup fails', async () => {
    const { service, followRepository } = createService();
    followRepository.find.mockRejectedValue(new Error('db down'));

    // A federation outage must not become a post-creation failure.
    expect(await service.getFollowerInstanceDomains('user-1')).toEqual([]);
  });

  it('scopes a re-drive post lookup to its author', async () => {
    const { service, postsService } = createService();
    // findPostsByUserId is author-scoped, so the result set holds only the
    // caller's own posts — post-2 belongs to someone else and never appears.
    postsService.findPostsByUserId.mockResolvedValue([
      { id: 'post-1', content: 'mine', createdAt: new Date(), isDraft: false },
    ]);

    const post = await service.getLocalPostForFederation('post-2', 'user-1');

    // Without that scope a re-drive endpoint would let a caller push someone
    // else's post under their own name.
    expect(post).toBeNull();
    expect(postsService.findPostsByUserId).toHaveBeenCalledWith('user-1');
  });

  it('returns an author post for re-drive', async () => {
    const { service, postsService } = createService();
    const createdAt = new Date('2026-09-01T00:00:00.000Z');
    postsService.findPostsByUserId.mockResolvedValue([
      { id: 'post-1', content: 'hello', createdAt, isDraft: false },
    ]);

    expect(await service.getLocalPostForFederation('post-1', 'user-1')).toEqual({
      id: 'post-1',
      content: 'hello',
      createdAt,
    });
  });

  it('refuses to re-drive a draft, encrypted, or anonymous post', async () => {
    const { service, postsService } = createService();
    postsService.findPostsByUserId.mockResolvedValue([
      { id: 'draft', content: 'x', isDraft: true },
      { id: 'enc', content: 'x', isEncrypted: true },
      { id: 'anon', content: 'x', isAnonymous: true },
    ]);

    expect(await service.getLocalPostForFederation('draft', 'user-1')).toBeNull();
    expect(await service.getLocalPostForFederation('enc', 'user-1')).toBeNull();
    expect(await service.getLocalPostForFederation('anon', 'user-1')).toBeNull();
  });

  it('lists a local user remote moderations', async () => {
    const { service, moderationRepository } = createService();
    const rows = [{ id: 'm1' }];
    moderationRepository.find.mockResolvedValue(rows);

    expect(await service.getRemoteModerations('user-1')).toBe(rows);
    expect(moderationRepository.find).toHaveBeenCalledWith({
      where: { localUser: { id: 'user-1' } },
      relations: ['remoteUser'],
      order: { updatedAt: 'DESC' },
    });
  });
});

describe('local actor and collection endpoints', () => {
  it('returns an ActivityPub Person document', async () => {
    const { service, userService } = createService();
    userService.findByUsername.mockResolvedValue({
      id: 'user-1',
      username: 'localuser',
      displayName: 'Local User',
      bio: 'hello',
      avatar: '/avatars/a.png',
    });

    const actor = await service.getLocalActor('localuser');

    expect(actor['@context']).toEqual([
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
    ]);
    expect(actor.type).toBe('Person');
    expect(actor.id).toBe('http://localhost:3001/federation/users/localuser');
    expect(actor.preferredUsername).toBe('localuser');
    expect(actor.name).toBe('Local User');
    expect(actor.summary).toBe('hello');
    expect(actor.icon.url).toBe('http://localhost:3001/avatars/a.png');
    expect(actor.inbox).toBe('http://localhost:3001/federation/users/localuser/inbox');
    expect(actor.outbox).toBe('http://localhost:3001/federation/users/localuser/outbox');
    expect(actor.followers).toBe('http://localhost:3001/federation/users/localuser/followers');
    expect(actor.following).toBe('http://localhost:3001/federation/users/localuser/following');
    expect(actor.publicKey.id).toBe('http://localhost:3001/federation/users/localuser#main-key');
    expect(actor.publicKey.owner).toBe('http://localhost:3001/federation/users/localuser');
    expect(actor.publicKey.publicKeyPem).toBe('PEM');
  });

  it('prefixes a slash onto an avatar path that lacks one', async () => {
    const { service, userService } = createService();
    userService.findByUsername.mockResolvedValue({
      id: 'user-1',
      username: 'localuser',
      avatar: 'avatars/b.png',
    });

    expect((await service.getLocalActor('localuser')).icon.url).toBe(
      'http://localhost:3001/avatars/b.png',
    );
  });

  it('falls back to the default avatar', async () => {
    const { service, userService } = createService();
    userService.findByUsername.mockResolvedValue({ id: 'user-1', username: 'localuser' });

    const actor = await service.getLocalActor('localuser');

    expect(actor.icon.url).toBe('http://localhost:3001/default-avatar.png');
    expect(actor.name).toBe('localuser');
  });

  it('404s for an unknown local actor', async () => {
    const { service, userService } = createService();
    userService.findByUsername.mockResolvedValue(null);

    await expect(service.getLocalActor('ghost')).rejects.toThrow('User not found');
  });

  it('returns a followers Collection', async () => {
    const { service, userService } = createService();
    userService.findByUsername.mockResolvedValue({
      id: 'user-1',
      username: 'localuser',
      followers: [{ username: 'a' }, { username: 'b' }],
    });

    const collection = await service.getLocalFollowers('localuser');

    expect(collection.type).toBe('Collection');
    expect(collection.id).toBe('http://localhost:3001/federation/users/localuser/followers');
    expect(collection.totalItems).toBe(2);
    expect(collection.items.map((item: any) => item.preferredUsername)).toEqual(['a', 'b']);
    expect(collection.items[0].id).toBe('http://localhost:3001/federation/users/a');
  });

  it('includes inbound remote followers in the collection', async () => {
    const { service, userService, followRepository } = createService();
    userService.findByUsername.mockResolvedValue({
      id: 'user-1',
      username: 'localuser',
      followers: [{ username: 'a' }],
    });
    followRepository.find.mockResolvedValue([
      { id: 'f1', remoteUser: { actorId: 'https://example.com/users/alice', username: 'alice' } },
    ]);

    const collection = await service.getLocalFollowers('localuser');

    // A remote follower that is absent from the followers Collection is the
    // reverse direction of the follow we just accepted: the peer that follows
    // us cannot read back the relationship it was told about.
    expect(collection.totalItems).toBe(2);
    expect(collection.items).toEqual([
      {
        id: 'http://localhost:3001/federation/users/a',
        type: 'Person',
        preferredUsername: 'a',
      },
      {
        id: 'https://example.com/users/alice',
        type: 'Person',
        preferredUsername: 'alice',
      },
    ]);
  });

  it('keeps totalItems equal to the items actually sent', async () => {
    const { service, userService, followRepository } = createService();
    userService.findByUsername.mockResolvedValue({ id: 'user-1', username: 'localuser' });
    followRepository.find.mockResolvedValue([
      { id: 'f1', remoteUser: { actorId: 'https://example.com/users/alice', username: 'alice' } },
      { id: 'f2', remoteUser: { actorId: null, username: 'broken' } },
    ]);

    const collection = await service.getLocalFollowers('localuser');

    // A row with no resolvable actorId is filtered out, so the count must not
    // include it — a Collection that claims more items than it contains is a
    // spec violation a peer will act on.
    expect(collection.items).toHaveLength(1);
    expect(collection.totalItems).toBe(1);
  });

  it('still serves the collection when the follow lookup fails', async () => {
    const { service, userService, followRepository } = createService();
    userService.findByUsername.mockResolvedValue({
      id: 'user-1',
      username: 'localuser',
      followers: [{ username: 'a' }],
    });
    followRepository.find.mockRejectedValue(new Error('db down'));

    const collection = await service.getLocalFollowers('localuser');

    // A federation outage should degrade the collection, not 500 it.
    expect(collection.totalItems).toBe(1);
  });

  it('returns a following Collection', async () => {
    const { service, userService } = createService();
    userService.findByUsername.mockResolvedValue({
      id: 'user-1',
      username: 'localuser',
      following: [{ username: 'c' }],
    });

    const collection = await service.getLocalFollowing('localuser');

    expect(collection.totalItems).toBe(1);
    expect(collection.items.map((item: any) => item.preferredUsername)).toEqual(['c']);
  });

  it('handles a user with no followers or following', async () => {
    const { service, userService } = createService();
    userService.findByUsername.mockResolvedValue({ id: 'user-1', username: 'localuser' });

    const followers = await service.getLocalFollowers('localuser');
    const following = await service.getLocalFollowing('localuser');

    expect(followers.totalItems).toBe(0);
    expect(followers.items).toEqual([]);
    expect(following.totalItems).toBe(0);
    expect(following.items).toEqual([]);
  });

  it('returns an OrderedCollection outbox', async () => {
    const { service, userService, postsService } = createService();
    userService.findByUsername.mockResolvedValue({ id: 'user-1', username: 'localuser' });
    postsService.findPostsByUserId.mockResolvedValue([
      { id: 'p 1', content: 'hello', createdAt: new Date('2026-07-04T00:00:00.000Z') },
    ]);

    const outbox = await service.getLocalOutbox('localuser');

    expect(outbox.type).toBe('OrderedCollection');
    expect(outbox.totalItems).toBe(1);
    expect(outbox.orderedItems[0].type).toBe('Create');
    expect(outbox.orderedItems[0].id).toBe(
      'http://localhost:3001/federation/activities/p%201',
    );
    expect(outbox.orderedItems[0].object).toEqual({
      id: 'http://localhost:3001/posts/p 1',
      type: 'Note',
      content: 'hello',
      published: '2026-07-04T00:00:00.000Z',
      attributedTo: 'http://localhost:3001/federation/users/localuser',
      to: ['https://www.w3.org/ns/activitystreams#Public'],
    });
  });

  it('returns an empty outbox for a user with no posts', async () => {
    const { service, userService } = createService();
    userService.findByUsername.mockResolvedValue({ id: 'user-1', username: 'localuser' });

    const outbox = await service.getLocalOutbox('localuser');

    expect(outbox.totalItems).toBe(0);
    expect(outbox.orderedItems).toEqual([]);
  });

  it('routes a user inbox to the shared inbox handler', async () => {
    const { service } = createService();

    const result = await service.processUserInbox('localuser', {});

    expect(result).toEqual({ success: false, received: false, reason: 'Missing activity type' });
  });
});

describe('webfinger', () => {
  it('resolves a local actor without any network call', async () => {
    const { service } = createService();

    const result = await service.webfinger('alice@zynkra.local');

    expect(result.subject).toBe('acct:alice@zynkra.local');
    expect(result.links).toEqual([
      {
        rel: 'self',
        type: 'application/activity+json',
        href: 'http://localhost:3001/federation/users/alice',
      },
    ]);
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('proxies a remote lookup', async () => {
    mockGet({ '/.well-known/webfinger': { subject: 'acct:bob@example.com' } });
    const { service } = createService();

    expect(await service.webfinger('bob@example.com')).toEqual({ subject: 'acct:bob@example.com' });
  });

  it('404s for an unknown remote domain', async () => {
    const { service } = createService({
      instanceRepository: { findOne: jest.fn().mockResolvedValue(null) },
    });

    await expect(service.webfinger('bob@unknown.example')).rejects.toThrow('Remote instance not found');
  });

  it('400s when the remote lookup fails', async () => {
    getSpy.mockRejectedValue(new Error('remote unreachable'));
    const { service } = createService();

    await expect(service.webfinger('bob@example.com')).rejects.toThrow('Webfinger lookup failed');
  });
});

describe('instance administration', () => {
  it('lists unblocked instances with their remote users', async () => {
    const { service, instanceRepository } = createService();
    const rows = [INSTANCE];
    instanceRepository.find.mockResolvedValue(rows);

    expect(await service.getConnectedInstances()).toBe(rows);
    expect(instanceRepository.find).toHaveBeenCalledWith({
      where: { isBlocked: false },
      relations: ['remoteUsers'],
    });
  });

  it('blocks and unblocks an instance', async () => {
    const { service, instanceRepository } = createService();

    await service.blockInstance('instance-1');
    expect(instanceRepository.update).toHaveBeenCalledWith('instance-1', { isBlocked: true });

    await service.unblockInstance('instance-1');
    expect(instanceRepository.update).toHaveBeenCalledWith('instance-1', { isBlocked: false });
  });

  it('reports federation configuration and counts', async () => {
    const { service, instanceRepository, remoteUserRepository, remotePostRepository } =
      createService();
    instanceRepository.count.mockImplementation((opts: any) =>
      Promise.resolve(opts?.where ? 2 : 3),
    );
    remoteUserRepository.count.mockResolvedValue(5);
    remotePostRepository.count.mockResolvedValue(7);

    expect(await service.getInstanceFederationStats()).toEqual({
      totalInstances: 3,
      activeInstances: 2,
      totalRemoteUsers: 5,
      totalRemotePosts: 7,
      localDomain: 'zynkra.local',
      localBaseUrl: 'http://localhost:3001',
      federationEnabled: false,
    });
  });

  it('returns cross-server replies oldest first', async () => {
    const { service, remotePostRepository } = createService();
    const rows = [{ id: 'r1' }, { id: 'r2' }];
    remotePostRepository.find.mockResolvedValue(rows);

    expect(await service.getRemoteReplies('https://example.com/posts/1')).toBe(rows);
    expect(remotePostRepository.find).toHaveBeenCalledWith({
      where: { inReplyToId: 'https://example.com/posts/1' },
      order: { publishedAt: 'ASC' },
    });
  });
});
