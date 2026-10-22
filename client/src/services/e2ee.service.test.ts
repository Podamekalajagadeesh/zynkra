/**
 * E2EEService rotation wiring — session freshness before send.
 *
 * The Signal library and network are mocked; what's under test is the policy:
 * when an existing session is reused as-is, when it's torn down because the
 * peer's identity key rotated, and when checks are skipped (throttle/offline).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
  API_BASE_URL: 'http://test.local',
}));

vi.mock('../lib/signal-protocol-store', () => ({
  createSignalProtocolStore: vi.fn(() => null),
  getPeerIdentityKey: vi.fn().mockResolvedValue(null),
}));

vi.mock('@privacyresearch/libsignal-protocol-typescript', () => ({
  SignalProtocolAddress: class {
    constructor(
      private readonly userId: string,
      private readonly deviceId: number
    ) {}
    toString(): string {
      return `${this.userId}.${this.deviceId}`;
    }
  },
}));

import { getE2EEService } from './e2ee.service';
import { api } from '../lib/api';
import { getPeerIdentityKey } from '../lib/signal-protocol-store';

type TestableService = {
  // IndexedDB-backed store (mocked in setup; `null` models uninitialized).
  store: any;
  userId: string | null;
  peerCheckedAt: Map<string, number>;
  ensureFreshSession: (id: string) => Promise<void>;
  establishSession: (id: string) => Promise<void>;
  getRotationEvents: (
    since?: string
  ) => Promise<
    Array<{ kind: string; keyId: number | null; detail: string | null; createdAt: string }>
  >;
};

function setupService(session: string | null): TestableService {
  const service = getE2EEService() as unknown as TestableService;
  service.store = {
    loadSession: vi.fn().mockResolvedValue(session),
    removeSession: vi.fn().mockResolvedValue(undefined),
  };
  service.userId = 'me';
  service.peerCheckedAt = new Map();
  return service;
}

const mockApiGet = api.get as ReturnType<typeof vi.fn>;
const mockGetPeerIdentityKey = getPeerIdentityKey as ReturnType<typeof vi.fn>;

/** base64 of [1,2,3] — computed the same way the service does. */
const CACHED_B64 = btoa(String.fromCharCode(1, 2, 3));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPeerIdentityKey.mockResolvedValue(null);
});

describe('E2EEService.ensureFreshSession', () => {
  it('establishes a session when none exists', async () => {
    const service = setupService(null);
    const spy = vi.spyOn(service, 'establishSession').mockResolvedValue(undefined);

    await service.ensureFreshSession('peer-1');

    expect(spy).toHaveBeenCalledWith('peer-1');
    expect(service.store.removeSession).not.toHaveBeenCalled();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('tears down and rebuilds when the peer identity rotated', async () => {
    const service = setupService('existing-session-json');
    const spy = vi.spyOn(service, 'establishSession').mockResolvedValue(undefined);
    mockApiGet.mockResolvedValue({ data: { publicKey: 'ROTATED-KEY' } });
    mockGetPeerIdentityKey.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

    await service.ensureFreshSession('peer-1');

    expect(service.store.removeSession).toHaveBeenCalledWith('peer-1.1');
    expect(spy).toHaveBeenCalledWith('peer-1');
  });

  it('keeps the session when identities match', async () => {
    const service = setupService('existing-session-json');
    const spy = vi.spyOn(service, 'establishSession').mockResolvedValue(undefined);
    mockApiGet.mockResolvedValue({ data: { publicKey: CACHED_B64 } });
    mockGetPeerIdentityKey.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

    await service.ensureFreshSession('peer-1');

    expect(service.store.removeSession).not.toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  });

  it('throttles repeat checks for the same peer within the TTL', async () => {
    const service = setupService('existing-session-json');
    vi.spyOn(service, 'establishSession').mockResolvedValue(undefined);
    service.peerCheckedAt.set('peer-1', Date.now());

    await service.ensureFreshSession('peer-1');

    expect(api.get).not.toHaveBeenCalled();
    expect(service.store.removeSession).not.toHaveBeenCalled();
  });

  it('keeps the session when the identity endpoint is unreachable', async () => {
    const service = setupService('existing-session-json');
    const spy = vi.spyOn(service, 'establishSession').mockResolvedValue(undefined);
    mockApiGet.mockRejectedValue(new Error('network down'));

    await service.ensureFreshSession('peer-1');

    expect(service.store.removeSession).not.toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  });

  it('keeps the session when nothing is cached yet (first check)', async () => {
    const service = setupService('existing-session-json');
    const spy = vi.spyOn(service, 'establishSession').mockResolvedValue(undefined);
    mockApiGet.mockResolvedValue({ data: { publicKey: 'ANY-KEY' } });
    mockGetPeerIdentityKey.mockResolvedValue(null);

    await service.ensureFreshSession('peer-1');

    expect(service.store.removeSession).not.toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('E2EEService.getRotationEvents', () => {
  it('fetches own rotation events with an optional since cursor', async () => {
    const service = setupService(null);
    const events = [
      { kind: 'identity', keyId: null, detail: null, createdAt: '2026-01-01T00:00:00.000Z' },
    ];
    mockApiGet.mockResolvedValue({ data: events });

    const withoutCursor = await service.getRotationEvents();
    expect(withoutCursor).toEqual(events);
    expect(api.get).toHaveBeenCalledWith('/keys/rotation-events');

    const since = '2026-01-01T00:00:00.000Z';
    await service.getRotationEvents(since);
    expect(api.get).toHaveBeenCalledWith(
      `/keys/rotation-events?since=${encodeURIComponent(since)}`
    );
  });

  it('throws when E2EE is not initialized', async () => {
    const service = getE2EEService() as unknown as TestableService;
    service.store = null;
    await expect(service.getRotationEvents()).rejects.toThrow('E2EE not initialized');
  });
});
