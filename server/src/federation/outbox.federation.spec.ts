import axios from 'axios';
import { Logger } from '@nestjs/common';
import { FederationService } from './federation.service';

jest.mock('../users/users.service', () => ({ UsersService: class UsersService {} }));
jest.mock('../posts/posts.service', () => ({ PostsService: class PostsService {} }));

const INSTANCE = { id: 'instance-1', domain: 'example.com', baseUrl: 'https://example.com' };

/** A remote post we have already stored, with a resolvable owning actor. */
const REMOTE_POST = {
  id: 'remote-post-1',
  activityId: 'https://example.com/posts/1',
  content: 'remote hello',
  author: {
    id: 'ru-1',
    actorId: 'https://example.com/users/alice',
    username: 'alice',
    inboxUrl: 'https://example.com/users/alice/inbox',
  },
  instance: { id: 'i-1', domain: 'example.com', baseUrl: 'https://example.com' },
};

const REMOTE_ACTOR_JSON = {
  preferredUsername: 'alice',
  name: 'Alice',
  summary: '',
  inbox: 'https://example.com/users/alice/inbox',
  outbox: 'https://example.com/users/alice/outbox',
  followers: 'https://example.com/users/alice/followers',
  following: 'https://example.com/users/alice/following',
};

type Harness = {
  service: any;
  instanceRepository: any;
  remotePostRepository: any;
  outboxRepository: any;
  outboxRows: any[];
  /** Rows the ledger lookup returns. */
  outboxLookup: any[];
};

function createService(
  options: { federationEnabled?: boolean; remotePost?: any } = {},
): Harness {
  const outboxRows: any[] = [];
  const outboxLookup: any[] = [];

  const instanceRepository = {
    findOne: jest.fn().mockResolvedValue(INSTANCE),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => data),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const remotePostRepository = {
    findOne: jest.fn().mockResolvedValue(
      options.remotePost === undefined ? REMOTE_POST : options.remotePost,
    ),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => ({ ...data, id: 'remote-post-1' })),
    remove: jest.fn().mockResolvedValue(undefined),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  };

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
  };

  const noopRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => data),
    remove: jest.fn(async (data: any) => data),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  };

  const configService = {
    get: (key: string, fallback?: any) => {
      if (key === 'FEDERATION_ENABLED') {
        return (options.federationEnabled ?? false) ? 'true' : 'false';
      }
      return fallback ?? null;
    },
  };

  const userService = {
    findOneById: jest.fn().mockResolvedValue({ id: 'user-1', username: 'localuser' }),
    findByUsername: jest.fn().mockResolvedValue({ id: 'user-1', username: 'localuser' }),
  };

  const httpSignaturesService = {
    getSignedPostHeaders: jest.fn(() => ({
      'Content-Type': 'application/activity+json',
      Signature: 'keyId="https://zynkra.test/federation/users/localuser#main-key"',
    })),
    getSignedGetHeaders: jest.fn(() => ({ Accept: 'application/activity+json' })),
    getPublicKeyPem: jest.fn(() => 'PEM'),
  };

  const service = new (FederationService as any)(
    instanceRepository,
    noopRepo,
    remotePostRepository,
    noopRepo,
    noopRepo,
    outboxRepository,
    configService,
    userService,
    { findPostsByUserId: jest.fn().mockResolvedValue([]) },
    httpSignaturesService,
  );

  return {
    service,
    instanceRepository,
    remotePostRepository,
    outboxRepository,
    outboxRows,
    outboxLookup,
  };
}

let postSpy: jest.SpyInstance;
let getSpy: jest.SpyInstance;

beforeAll(() => {
  Logger.overrideLogger(false);
});

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  postSpy = jest
    .spyOn(axios as any, 'post')
    .mockImplementation(() => Promise.reject(new Error('axios.post called without a stub')));
  getSpy = jest
    .spyOn(axios as any, 'get')
    .mockImplementation(() => Promise.reject(new Error('axios.get called without a stub')));
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

/** The single activity body handed to axios.post. */
function sentActivity(): any {
  return JSON.parse(postSpy.mock.calls[0][1]);
}

describe('federateLike', () => {
  it('delivers a signed Like to the author of the object', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, httpSignaturesService } = createService({ federationEnabled: true });

    const report = await service.federateLike('user-1', 'https://example.com/posts/1');

    expect(report.delivered).toBe(1);
    const activity = sentActivity();
    expect(activity.type).toBe('Like');
    // The object is the remote activity id, not a copy of the Note.
    expect(activity.object).toBe('https://example.com/posts/1');
    // Addressed to the object's owner, and to nobody else.
    expect(activity.to).toEqual(['https://example.com/users/alice']);
    expect(activity.cc).toEqual([]);
    expect(activity.actor).toBe('http://localhost:3001/federation/users/localuser');

    // The author's inbox, not the instance shared inbox that a fan-out would
    // have used, and not the local user's own followers.
    expect(postSpy.mock.calls[0][0]).toBe('https://example.com/users/alice/inbox');
    expect(httpSignaturesService.getSignedPostHeaders).toHaveBeenCalledWith(
      'http://localhost:3001/federation/users/localuser',
      expect.any(String),
      'https://example.com/users/alice/inbox',
    );
  });

  it('records the Like so an Undo can reference its exact id', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, outboxRows } = createService({ federationEnabled: true });

    await service.federateLike('user-1', 'https://example.com/posts/1');

    // An Undo that does not wrap the id the peer actually received is ignored,
    // and the like becomes permanent on the remote server.
    expect(outboxRows).toHaveLength(1);
    expect(outboxRows[0].activityType).toBe('Like');
    expect(outboxRows[0].objectId).toBe('https://example.com/posts/1');
    expect(outboxRows[0].activityId).toBe(sentActivity().id);
  });

  it('does not send a second Like for the same object', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, outboxLookup } = createService({ federationEnabled: true });
    outboxLookup.push({
      activityId: 'http://localhost:3001/federation/activities/like-1',
      objectId: 'https://example.com/posts/1',
      activityType: 'Like',
    });

    const report = await service.federateLike('user-1', 'https://example.com/posts/1');

    // Mastodon rejects a duplicate Like, and a retried double-tap looks like spam.
    expect(postSpy).not.toHaveBeenCalled();
    expect(report.skipped).toBe(true);
    expect(report.activityId).toBe('http://localhost:3001/federation/activities/like-1');
  });

  it('sends nothing when the remote object cannot be resolved', async () => {
    const { service } = createService({ federationEnabled: true, remotePost: null });
    getSpy.mockRejectedValue(new Error('unreachable'));

    const report = await service.federateLike('user-1', 'https://example.com/posts/1');

    expect(postSpy).not.toHaveBeenCalled();
    expect(report.skipped).toBe(true);
    expect(report.reason).toContain('no known remote object');
  });

  it('sends nothing when the object has no resolvable author', async () => {
    // A post persisted with an unresolved author is not addressable: a Like with
    // no `to` would be delivered as a public broadcast.
    const { service } = createService({
      federationEnabled: true,
      remotePost: { ...REMOTE_POST, author: null },
    });

    const report = await service.federateLike('user-1', 'https://example.com/posts/1');

    expect(postSpy).not.toHaveBeenCalled();
    expect(report.skipped).toBe(true);
  });

  it('refuses to a blocked instance', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, instanceRepository } = createService({ federationEnabled: true });
    instanceRepository.findOne.mockResolvedValue(null);

    const report = await service.federateLike('user-1', 'https://example.com/posts/1');

    // A block that covered only `Create` would be bypassed by liking instead.
    expect(postSpy).not.toHaveBeenCalled();
    expect(report.delivered).toBe(0);
    expect(report.results[0].reason).toContain('not connected or is blocked');
  });

  it('refuses to like while federation is disabled', async () => {
    const { service } = createService({ federationEnabled: false });
    await expect(service.federateLike('user-1', 'https://example.com/posts/1')).rejects.toThrow(
      'Outbound federation is disabled',
    );
  });
});

describe('federateUndoLike', () => {
  it('wraps the recorded Like id in an Undo', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, outboxLookup } = createService({ federationEnabled: true });
    outboxLookup.push({
      activityId: 'http://localhost:3001/federation/activities/like-1',
      objectId: 'https://example.com/posts/1',
      activityType: 'Like',
    });

    const report = await service.federateUndoLike('user-1', 'https://example.com/posts/1');

    expect(report.delivered).toBe(1);
    const activity = sentActivity();
    expect(activity.type).toBe('Undo');
    // The id must be the one the peer received, not a freshly minted one.
    expect(activity.object.id).toBe('http://localhost:3001/federation/activities/like-1');
    expect(activity.object.type).toBe('Like');
    expect(activity.to).toEqual(['https://example.com/users/alice']);
    expect(postSpy.mock.calls[0][0]).toBe('https://example.com/users/alice/inbox');
  });

  it('sends nothing when no Like was ever federated', async () => {
    const { service } = createService({ federationEnabled: true });

    const report = await service.federateUndoLike('user-1', 'https://example.com/posts/1');

    // An Undo for an activity the peer never received is noise.
    expect(postSpy).not.toHaveBeenCalled();
    expect(report.skipped).toBe(true);
    expect(report.reason).toContain('never federated');
  });

  it('looks up the Like, not a Create, for the same object', async () => {
    const { service, outboxRepository } = createService({ federationEnabled: true });

    await service.federateUndoLike('user-1', 'https://example.com/posts/1');

    // A Create recorded against the same objectId must not satisfy the lookup.
    expect(outboxRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { objectId: 'https://example.com/posts/1', activityType: 'Like' },
      }),
    );
  });
});

describe('federateUndoAnnounce', () => {
  it('wraps the recorded Announce id in an Undo', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, outboxLookup } = createService({ federationEnabled: true });
    outboxLookup.push({
      activityId: 'http://localhost:3001/federation/activities/ann-1',
      objectId: 'https://example.com/posts/1',
      activityType: 'Announce',
    });

    const report = await service.federateUndoAnnounce('user-1', 'https://example.com/posts/1');

    expect(report.delivered).toBe(1);
    const activity = sentActivity();
    expect(activity.type).toBe('Undo');
    expect(activity.object.id).toBe('http://localhost:3001/federation/activities/ann-1');
    expect(activity.object.type).toBe('Announce');
  });

  it('sends nothing when the boost was never federated', async () => {
    const { service } = createService({ federationEnabled: true });

    const report = await service.federateUndoAnnounce('user-1', 'https://example.com/posts/1');

    expect(postSpy).not.toHaveBeenCalled();
    expect(report.skipped).toBe(true);
  });
});

describe('federateUpdate', () => {
  const CREATE_ROW = {
    activityId: 'http://localhost:3001/federation/activities/create-1',
    objectId: 'http://localhost:3001/federation/posts/post-1',
    activityType: 'Create',
    deliveredTo: ['example.com'],
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
  };

  it('reuses the Note id so the peer edits rather than duplicates', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, outboxLookup } = createService({ federationEnabled: true });
    outboxLookup.push(CREATE_ROW);

    const report = await service.federateUpdate('user-1', 'post-1', 'edited text');

    expect(report.delivered).toBe(1);
    const activity = sentActivity();
    expect(activity.type).toBe('Update');
    // A new object id would create a second post on the peer instead of
    // revising the first.
    expect(activity.object.id).toBe('http://localhost:3001/federation/posts/post-1');
    expect(activity.object.content).toBe('edited text');
    // The original publish time is immutable; changing it reshuffles timelines.
    expect(activity.object.published).toBe('2026-09-01T00:00:00.000Z');
  });

  it('sends nothing for a post that was never federated', async () => {
    const { service } = createService({ federationEnabled: true });

    const report = await service.federateUpdate('user-1', 'post-1', 'edited text');

    expect(postSpy).not.toHaveBeenCalled();
    expect(report.skipped).toBe(true);
    expect(report.reason).toContain('never federated');
  });

  it('refuses to propagate the encrypted placeholder as content', async () => {
    const { service, outboxLookup } = createService({ federationEnabled: true });
    outboxLookup.push(CREATE_ROW);

    const report = await service.federateUpdate('user-1', 'post-1', '[Encrypted Content]');

    // A post can become encrypted after it was federated; pushing the
    // placeholder would replace the real text on every peer with garbage.
    expect(postSpy).not.toHaveBeenCalled();
    expect(report.skipped).toBe(true);
  });

  it('re-targets the instances that accepted the Create', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, outboxLookup, instanceRepository } = createService({
      federationEnabled: true,
    });
    outboxLookup.push({ ...CREATE_ROW, deliveredTo: ['first.example'] });
    instanceRepository.findOne.mockImplementation(async ({ where }: any) =>
      where.domain === 'first.example' ? { ...INSTANCE, baseUrl: 'https://first.example' } : null,
    );

    const report = await service.federateUpdate('user-1', 'post-1', 'edited text', [
      'newfollower.example',
    ]);

    expect(report.delivered).toBe(1);
    expect(postSpy.mock.calls[0][0]).toBe('https://first.example/inbox');
  });

  it('records the Update in the ledger', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, outboxLookup, outboxRows } = createService({ federationEnabled: true });
    outboxLookup.push(CREATE_ROW);

    await service.federateUpdate('user-1', 'post-1', 'edited text');

    expect(outboxRows).toHaveLength(1);
    expect(outboxRows[0].activityType).toBe('Update');
  });
});

describe('Create/Delete round trip', () => {
  /**
   * The regression this whole ledger exists for.
   *
   * `federatePost` used to record the *activity* id in `federated_posts` while
   * `federateDelete` looked up the *Note* id, so the lookup could never match
   * and every federated retraction silently did nothing. The old test missed it
   * by stubbing `findOne` to return a matching row instead of round-tripping a
   * real Create into a real Delete. This walks the actual pair.
   */
  it('finds the Create it just sent, using one shared key', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service, outboxRows, outboxRepository } = createService({ federationEnabled: true });

    await service.federatePost('user-1', { activityId: 'post-1', content: 'hi' } as any, [
      'example.com',
    ]);

    // Make the ledger behave like the real table: a write is a later read.
    outboxRepository.findOne.mockImplementation(async ({ where }: any) => {
      const match = outboxRows.find(
        (row) => row.objectId === where.objectId && row.activityType === where.activityType,
      );
      return match ?? null;
    });

    postSpy.mockClear();
    const report = await service.federateDelete('user-1', 'post-1', ['example.com']);

    expect(report.skipped).toBeUndefined();
    expect(report.delivered).toBe(1);
    expect(sentActivity().type).toBe('Delete');
    expect(sentActivity().object.id).toBe(outboxRows[0].activityId);
  });
});

describe('deliverToInbox — explicit inbox target', () => {
  it('uses the actor inbox rather than the instance shared inbox', async () => {
    postSpy.mockResolvedValue({ status: 202 });
    const { service } = createService({ federationEnabled: true });

    const result = await service.deliverToInbox(
      {},
      { type: 'Like' },
      { inboxUrl: 'https://example.com/users/alice/inbox' },
    );

    expect(result.delivered).toBe(true);
    expect(postSpy.mock.calls[0][0]).toBe('https://example.com/users/alice/inbox');
  });

  it('still skips when there is neither an inbox nor a baseUrl', async () => {
    const { service } = createService({ federationEnabled: true });

    const result = await service.deliverToInbox({}, { type: 'Like' });

    expect(postSpy).not.toHaveBeenCalled();
    expect(result).toEqual({
      delivered: false,
      skipped: true,
      reason: 'instance has no baseUrl',
    });
  });
});
