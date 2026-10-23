/**
 * Federation delivery dead-letter queue.
 *
 * A delivery that exhausts its in-request retries used to be reported in a
 * `FederationReport` and then forgotten — nothing retained the activity, so
 * nothing could redrive it when the peer recovered. These tests pin the queue:
 * failures are retained with the payload verbatim, the scheduled redrive
 * re-delivers, deterministic rejections go straight to dead, and exhaustion or
 * a vanished instance marks the row dead rather than retrying forever.
 */
import axios from 'axios';
import { Logger } from '@nestjs/common';
import { FederationService } from './federation.service';

jest.mock('../users/users.service', () => ({ UsersService: class UsersService {} }));
jest.mock('../posts/posts.service', () => ({ PostsService: class PostsService {} }));

const INSTANCE = {
  id: 'instance-1',
  domain: 'peer.example',
  baseUrl: 'https://peer.example',
  isBlocked: false,
};

const ACTIVITY = {
  id: 'https://zynkra.local/federation/activities/act-1',
  type: 'Create',
  actor: 'https://zynkra.local/federation/users/alice',
};

type DeliveryRow = {
  id: string;
  activityId: string;
  activityType: string;
  payload: string;
  inboxUrl: string;
  instanceDomain: string;
  actorUsername: string | null;
  attempts: number;
  lastStatus: number | null;
  lastReason: string | null;
  retryable: boolean;
  dead: boolean;
  nextRetryAt: Date | null;
  completedAt: Date | null;
};

function createHarness(overrides: { federationEnabled?: boolean } = {}) {
  const federationEnabled = overrides.federationEnabled ?? true;
  const rows: DeliveryRow[] = [];
  let rowSeq = 0;

  const deliveryAttemptRepository = {
    find: jest.fn().mockImplementation(async (options: any) => {
      let result = rows.slice();
      const where = options?.where ?? {};
      if (where.dead !== undefined) {
        result = result.filter((r) => r.dead === where.dead);
      }
      if (where.completedAt !== undefined) {
        // IsNull() / Not(IsNull()) both arrive; distinguish by presence of value.
        const isNullMarker = where.completedAt as any;
        const wantNull = isNullMarker === null || isNullMarker?.type === 'isNull';
        result = result.filter((r) => (wantNull ? r.completedAt === null : r.completedAt !== null));
      }
      if (where.nextRetryAt !== undefined) {
        const op = where.nextRetryAt as any;
        const value = op?.value ?? op;
        result = result.filter((r) => r.nextRetryAt !== null && r.nextRetryAt <= (value as Date));
      }
      if (options?.take) result = result.slice(0, options.take);
      return result;
    }),
    findOne: jest.fn().mockImplementation(async ({ where }: any) => {
      return (
        rows.find(
          (r) =>
            (!where.id || r.id === where.id) &&
            (!where.activityId || r.activityId === where.activityId) &&
            (!where.inboxUrl || r.inboxUrl === where.inboxUrl) &&
            (where.completedAt === undefined || r.completedAt === null) &&
            (where.dead === undefined || r.dead === where.dead)
        ) ?? null
      );
    }),
    create: jest.fn((row: any) => ({ ...row })),
    save: jest.fn(async (row: any) => {
      if (!row.id) {
        row.id = `dlq-${++rowSeq}`;
        rows.push(row);
      }
      return row;
    }),
    update: jest.fn().mockImplementation(async (criteria: any, patch: any) => {
      const targets = rows.filter((r) =>
        criteria.id
          ? r.id === criteria.id
          : (!criteria.activityId || r.activityId === criteria.activityId) &&
            (!criteria.instanceDomain || r.instanceDomain === criteria.instanceDomain) &&
            (criteria.completedAt === undefined || r.completedAt === null) &&
            (criteria.dead === undefined || r.dead === criteria.dead)
      );
      for (const target of targets) Object.assign(target, patch);
      return { affected: targets.length };
    }),
  };

  const instanceRepository = {
    findOne: jest.fn().mockImplementation(async ({ where }: any) => {
      if (where?.isBlocked === false && INSTANCE.domain === where.domain && !INSTANCE.isBlocked) {
        return { ...INSTANCE };
      }
      return null;
    }),
  };

  const configService = {
    get: (key: string, fallback?: any) => {
      if (key === 'FEDERATION_ENABLED') return federationEnabled ? 'true' : 'false';
      if (key === 'INSTANCE_DOMAIN') return 'zynkra.local';
      if (key === 'INSTANCE_BASE_URL') return 'https://zynkra.local';
      if (key === 'DELIVERY_RETRIES') return '3';
      if (key === 'DELIVERY_RETRY_DELAY_MS') return '1';
      return fallback ?? null;
    },
  };

  const httpSignaturesService = {
    getSignedPostHeaders: jest.fn().mockReturnValue({ host: 'peer.example' }),
    initialize: jest.fn().mockResolvedValue(undefined),
  };

  const userService = {
    findOneById: jest.fn().mockResolvedValue({ id: 'user-1', username: 'alice' }),
  };

  const service = new (FederationService as any)(
    instanceRepository,
    { findOne: jest.fn().mockResolvedValue(null) },
    { findOne: jest.fn().mockResolvedValue(null) },
    { findOne: jest.fn().mockResolvedValue(null) },
    { findOne: jest.fn().mockResolvedValue(null) },
    { findOne: jest.fn().mockResolvedValue(null) },
    deliveryAttemptRepository,
    configService,
    userService,
    { findPostsByUserId: jest.fn().mockResolvedValue([]) },
    httpSignaturesService,
    { findOne: jest.fn().mockResolvedValue(null) }
  ) as FederationService;

  return { service: service as any, rows, deliveryAttemptRepository, instanceRepository };
}

let postSpy: jest.SpyInstance;

beforeAll(() => {
  Logger.overrideLogger(false);
});

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  postSpy = jest
    .spyOn(axios as any, 'post')
    .mockImplementation(() => Promise.reject(new Error('axios.post called without a stub')));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('federation delivery dead-letter queue', () => {
  it('retains a retryable failure with the payload verbatim', async () => {
    const { service, rows } = createHarness();
    postSpy.mockImplementation(() =>
      Promise.reject({ response: { status: 503 }, isAxiosError: true })
    );

    const report = await (service as any).fanOut('user-1', ACTIVITY, ['peer.example']);

    expect(report.delivered).toBe(0);
    expect(report.failed).toBe(1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      activityId: ACTIVITY.id,
      activityType: 'Create',
      instanceDomain: 'peer.example',
      inboxUrl: 'https://peer.example/inbox',
      actorUsername: 'alice',
      retryable: true,
      dead: false,
      completedAt: null,
    });
    expect(JSON.parse(rows[0].payload)).toEqual(ACTIVITY);
    expect(rows[0].nextRetryAt).toBeInstanceOf(Date);
  });

  it('stores deterministic rejections dead immediately', async () => {
    const { service, rows } = createHarness();
    postSpy.mockImplementation(() =>
      Promise.reject({ response: { status: 403 }, isAxiosError: true })
    );

    await (service as any).fanOut('user-1', ACTIVITY, ['peer.example']);

    expect(rows).toHaveLength(1);
    expect(rows[0].dead).toBe(true);
    expect(rows[0].retryable).toBe(false);
    expect(rows[0].nextRetryAt).toBeNull();
    expect(rows[0].lastReason).toMatch(/signature rejected/);
  });

  it('marks a prior pending row delivered when a later fan-out succeeds', async () => {
    const { service, rows } = createHarness();
    postSpy.mockImplementation(() =>
      Promise.reject({ response: { status: 503 }, isAxiosError: true })
    );
    await (service as any).fanOut('user-1', ACTIVITY, ['peer.example']);
    expect(rows[0].completedAt).toBeNull();

    postSpy.mockReset();
    postSpy.mockResolvedValue({ status: 202, data: {} });
    await (service as any).fanOut('user-1', ACTIVITY, ['peer.example']);

    expect(rows[0].completedAt).toBeInstanceOf(Date);
    expect(rows[0].nextRetryAt).toBeNull();
  });

  it('scheduled redrive re-delivers a due pending row', async () => {
    const { service, rows } = createHarness();
    rows.push({
      id: 'dlq-1',
      activityId: ACTIVITY.id,
      activityType: 'Create',
      payload: JSON.stringify(ACTIVITY),
      inboxUrl: 'https://peer.example/inbox',
      instanceDomain: 'peer.example',
      actorUsername: 'alice',
      attempts: 1,
      lastStatus: 503,
      lastReason: 'service unavailable',
      retryable: true,
      dead: false,
      nextRetryAt: new Date(Date.now() - 1000),
      completedAt: null,
    });
    postSpy.mockResolvedValue({ status: 202, data: {} });

    await (service as any).redriveFailedDeliveries();

    expect(rows[0].completedAt).toBeInstanceOf(Date);
    expect(postSpy).toHaveBeenCalledTimes(1);
    const [, body, config] = postSpy.mock.calls[0];
    expect(JSON.parse(body)).toEqual(ACTIVITY);
    expect(config.headers).toBeDefined();
  });

  it('does not redrive when federation is disabled', async () => {
    const { service, rows } = createHarness({ federationEnabled: false });
    rows.push({
      id: 'dlq-1',
      activityId: ACTIVITY.id,
      activityType: 'Create',
      payload: JSON.stringify(ACTIVITY),
      inboxUrl: 'https://peer.example/inbox',
      instanceDomain: 'peer.example',
      actorUsername: null,
      attempts: 1,
      lastStatus: null,
      lastReason: null,
      retryable: true,
      dead: false,
      nextRetryAt: new Date(Date.now() - 1000),
      completedAt: null,
    });

    await (service as any).redriveFailedDeliveries();

    expect(postSpy).not.toHaveBeenCalled();
    expect(rows[0].completedAt).toBeNull();
  });

  it('kills the row when the instance is no longer available', async () => {
    const { service, rows } = createHarness();
    rows.push({
      id: 'dlq-1',
      activityId: ACTIVITY.id,
      activityType: 'Create',
      payload: JSON.stringify(ACTIVITY),
      inboxUrl: 'https://peer.example/inbox',
      instanceDomain: 'gone.example',
      actorUsername: null,
      attempts: 1,
      lastStatus: null,
      lastReason: null,
      retryable: true,
      dead: false,
      nextRetryAt: new Date(Date.now() - 1000),
      completedAt: null,
    });

    await (service as any).redriveFailedDeliveries();

    expect(rows[0].dead).toBe(true);
    expect(rows[0].lastReason).toMatch(/no longer connected/);
  });

  it('marks the row dead once attempts are exhausted', async () => {
    const { service, rows } = createHarness();
    rows.push({
      id: 'dlq-1',
      activityId: ACTIVITY.id,
      activityType: 'Create',
      payload: JSON.stringify(ACTIVITY),
      inboxUrl: 'https://peer.example/inbox',
      instanceDomain: 'peer.example',
      actorUsername: null,
      attempts: 9,
      lastStatus: 503,
      lastReason: null,
      retryable: true,
      dead: false,
      nextRetryAt: new Date(Date.now() - 1000),
      completedAt: null,
    });
    postSpy.mockImplementation(() =>
      Promise.reject({ response: { status: 503 }, isAxiosError: true })
    );

    await (service as any).redriveFailedDeliveries();

    expect(rows[0].dead).toBe(true);
    expect(rows[0].attempts).toBe(10);
    expect(rows[0].lastReason).toMatch(/attempts exhausted/);
  });

  it('manual redrive can finish a dead row after the cause is fixed', async () => {
    const { service, rows } = createHarness();
    rows.push({
      id: 'dlq-1',
      activityId: ACTIVITY.id,
      activityType: 'Create',
      payload: JSON.stringify(ACTIVITY),
      inboxUrl: 'https://peer.example/inbox',
      instanceDomain: 'peer.example',
      actorUsername: 'alice',
      attempts: 10,
      lastStatus: 403,
      lastReason: 'signature rejected (403)',
      retryable: false,
      dead: true,
      nextRetryAt: null,
      completedAt: null,
    });
    postSpy.mockResolvedValue({ status: 202, data: {} });

    const result = await (service as any).manuallyRedriveDelivery('dlq-1');

    expect(result).toEqual({ redriven: true, delivered: true });
    expect(rows[0].completedAt).toBeInstanceOf(Date);
  });

  it('manual redrive reports already-delivered rows without re-sending', async () => {
    const { service, rows } = createHarness();
    rows.push({
      id: 'dlq-1',
      activityId: ACTIVITY.id,
      activityType: 'Create',
      payload: JSON.stringify(ACTIVITY),
      inboxUrl: 'https://peer.example/inbox',
      instanceDomain: 'peer.example',
      actorUsername: null,
      attempts: 1,
      lastStatus: null,
      lastReason: null,
      retryable: true,
      dead: false,
      nextRetryAt: null,
      completedAt: new Date(),
    });

    const result = await (service as any).manuallyRedriveDelivery('dlq-1');

    expect(result).toEqual({ redriven: false, delivered: true, reason: 'already delivered' });
    expect(postSpy).not.toHaveBeenCalled();
  });
});
