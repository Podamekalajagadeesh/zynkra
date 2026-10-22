/**
 * Two-party E2EE round-trip through the REAL service and REAL Signal Protocol
 * library — the automated stand-in for the manual two-browser verification.
 *
 * Two E2EEService instances (alice, bob) each hold an in-memory
 * SignalProtocolStore; the key-directory API is a fake in-memory server that
 * behaves like `src/keys` on the backend (bundle fetches consume one-time
 * pre-keys, identity endpoints serve the current identity).
 *
 * What this proves end-to-end:
 *  - X3DH establishment with real signed-prekey signature verification,
 *  - bidirectional Double Ratchet (pre-key message first, then ratcheting
 *    whispers both ways),
 *  - rotation: when bob reinstalls (new identity), alice's pre-send freshness
 *    check tears down the stale session, re-runs X3DH, and the conversation
 *    continues — bob decrypts under the new identity,
 *  - offline tolerance: an unreachable identity endpoint keeps, not breaks,
 *    an existing session.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
  interface ServerUser {
    identity: string | null;
    spk: { keyId: number; publicKey: string; signature: string } | null;
    otpks: Array<{ keyId: number; publicKey: string }>;
  }

  const users = new Map<string, ServerUser>();
  // Registered by the signal-protocol-store mock: userId → in-memory store.
  const memStores = new Map<string, any>();
  const state = {
    actor: '',
    identityDown: false,
  };

  const userFor = (userId: string): ServerUser => {
    let u = users.get(userId);
    if (!u) {
      u = { identity: null, spk: null, otpks: [] };
      users.set(userId, u);
    }
    return u;
  };

  return { users, memStores, state, userFor };
});

vi.mock('../lib/api', () => ({
  API_BASE_URL: 'http://test.local',
  api: {
    get: vi.fn(async (url: string) => {
      const { state, users, userFor } = h;
      if (url.startsWith('/keys/bundle/')) {
        const userId = url.slice('/keys/bundle/'.length);
        const u = users.get(userId);
        if (!u || !u.identity || !u.spk) {
          throw new Error(`no keys published for ${userId}`);
        }
        // Atomic-claim emulation: one fetch consumes one one-time pre-key.
        const oneTimePreKey = u.otpks.length > 0 ? u.otpks.shift()! : null;
        return {
          data: {
            registrationId: 1,
            identityKey: u.identity,
            signedPreKey: u.spk,
            oneTimePreKey,
            identityRotatedAt: null,
          },
        };
      }
      if (url.startsWith('/keys/identity/')) {
        if (state.identityDown) throw new Error('network down');
        const userId = url.slice('/keys/identity/'.length);
        const u = users.get(userId);
        if (!u || !u.identity) {
          const err = new Error('identity not found') as Error & {
            response: { status: number };
          };
          err.response = { status: 404 };
          throw err;
        }
        return { data: { publicKey: u.identity, rotatedAt: null } };
      }
      if (url === '/keys/prekey-count') {
        const u = userFor(state.actor);
        return { data: { count: u.otpks.length } };
      }
      if (url.startsWith('/keys/rotation-events')) {
        return { data: [] };
      }
      throw new Error(`unhandled GET ${url}`);
    }),
    post: vi.fn(async (url: string, body: any) => {
      const { state, userFor } = h;
      // Uploads are attributed to the acting party (set via runAs/bootstrap).
      const u = userFor(state.actor);
      if (url === '/keys/identity') {
        u.identity = body.identityKey;
        // Mirror the server's purge-on-identity-change (prekeys.service.ts):
        // pre-keys under the old identity are cryptographically dead.
        u.spk = null;
        u.otpks = [];
        return { data: undefined };
      }
      if (url === '/keys/signed-prekey') {
        u.spk = body;
        return { data: undefined };
      }
      if (url === '/keys/one-time-prekeys') {
        u.otpks.push(...body.preKeys);
        return { data: { count: u.otpks.length } };
      }
      if (url === '/keys/bundle') {
        return { data: undefined };
      }
      throw new Error(`unhandled POST ${url}`);
    }),
  },
}));

vi.mock('../lib/signal-protocol-store', () => {
  class MemStore {
    identity: { privKey: ArrayBuffer; pubKey: ArrayBuffer } | undefined = undefined;
    registrationId = 1;
    preKeys = new Map<number, { privKey: ArrayBuffer; pubKey: ArrayBuffer }>();
    signedPreKeys = new Map<number, { privKey: ArrayBuffer; pubKey: ArrayBuffer }>();
    sessions = new Map<string, string>();
    peerIdentities = new Map<string, ArrayBuffer>();

    async getIdentityKeyPair() {
      return this.identity;
    }
    async getLocalRegistrationId() {
      return this.registrationId;
    }
    async isTrustedIdentity(): Promise<boolean> {
      return true; // TOFU — mirrors the production store
    }
    async saveIdentity(identifier: string, identityKey: ArrayBuffer) {
      const existed = this.peerIdentities.has(identifier);
      this.peerIdentities.set(identifier, identityKey);
      return !existed;
    }
    async loadPreKey(keyId: number) {
      return this.preKeys.get(keyId);
    }
    async storePreKey(keyId: number, keyPair: { privKey: ArrayBuffer; pubKey: ArrayBuffer }) {
      this.preKeys.set(keyId, keyPair);
    }
    async removePreKey(keyId: number) {
      this.preKeys.delete(keyId);
    }
    async loadSignedPreKey(keyId: number) {
      return this.signedPreKeys.get(keyId);
    }
    async storeSignedPreKey(keyId: number, keyPair: { privKey: ArrayBuffer; pubKey: ArrayBuffer }) {
      this.signedPreKeys.set(keyId, keyPair);
    }
    async loadSession(identifier: string) {
      return this.sessions.get(identifier);
    }
    async storeSession(identifier: string, record: string) {
      this.sessions.set(identifier, record);
    }
    async removeSession(identifier: string) {
      this.sessions.delete(identifier);
    }
    async removeAllSessions(identifier: string) {
      this.sessions.delete(identifier);
    }
  }

  return {
    createSignalProtocolStore: (userId: string) => {
      const store = new MemStore();
      h.memStores.set(userId, store);
      return store;
    },
    saveIdentityKeyPair: vi.fn(
      async (userId: string, keyPair: { privKey: ArrayBuffer; pubKey: ArrayBuffer }) => {
        const store = h.memStores.get(userId);
        if (store) store.identity = keyPair;
      }
    ),
    getPeerIdentityKey: vi.fn(async (identifier: string) => {
      const store = h.memStores.get(h.state.actor);
      return store?.peerIdentities.get(identifier) ?? null;
    }),
    collectE2eeStoreData: vi.fn(async () => {
      throw new Error('not used in round-trip tests');
    }),
    restoreE2eeStoreData: vi.fn(async () => {
      throw new Error('not used in round-trip tests');
    }),
  };
});

import { E2EEService } from './e2ee.service';

// Deliberately NOT an intersection with the class: E2EEService's private
// fields would collapse `E2EEService & {...}` to `never`.
type Party = {
  initialize: (userId: string) => Promise<void>;
  encryptMessage: (recipientId: string, plaintext: string) => Promise<string>;
  decryptMessage: (senderId: string, ciphertextJson: string) => Promise<string>;
  hasSession: (userId: string) => Promise<boolean>;
  peerCheckedAt: Map<string, number>;
};

async function bootstrap(userId: string): Promise<Party> {
  h.state.actor = userId;
  const svc = new E2EEService() as unknown as Party;
  await svc.initialize(userId);
  return svc;
}

async function runAs<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  h.state.actor = userId;
  return fn();
}

beforeEach(() => {
  h.users.clear();
  h.memStores.clear();
  h.state.actor = '';
  h.state.identityDown = false;
  vi.clearAllMocks();
});

describe('two-party E2EE round-trip (real Signal Protocol)', () => {
  it('establishes X3DH and ratchets messages in both directions', async () => {
    const alice = await bootstrap('alice');
    const bob = await bootstrap('bob');

    // Alice → Bob (pre-key message, first contact)
    const m1 = await runAs('alice', () => alice.encryptMessage('bob', 'hello bob, it is alice'));
    expect(await bob.decryptMessage('alice', m1)).toBe('hello bob, it is alice');

    // Bob → Alice (reply under the session created by the inbound message)
    const m2 = await runAs('bob', () =>
      bob.encryptMessage('alice', 'hi alice, got you loud and clear')
    );
    expect(await alice.decryptMessage('bob', m2)).toBe('hi alice, got you loud and clear');

    // Round two — the ratchet must advance and stay in sync.
    const m3 = await runAs('alice', () =>
      alice.encryptMessage('bob', 'second message (ratcheted)')
    );
    expect(await bob.decryptMessage('alice', m3)).toBe('second message (ratcheted)');
    const m4 = await runAs('bob', () => bob.encryptMessage('alice', 'and back'));
    expect(await alice.decryptMessage('bob', m4)).toBe('and back');

    expect(await alice.hasSession('bob')).toBe(true);
    expect(await bob.hasSession('alice')).toBe(true);
  }, 30_000);

  it('rebuilds the session when the peer reinstalls with a new identity', async () => {
    const alice = await bootstrap('alice');
    await bootstrap('bob');

    // Contact established under bob's ORIGINAL identity.
    const m1 = await runAs('alice', () => alice.encryptMessage('bob', 'v1'));
    const bobV1 = h.memStores.get('bob');
    expect(bobV1).toBeTruthy();

    // "Reinstall": a brand-new device with a fresh store generates and
    // publishes a NEW identity (server entry is overwritten by the uploads).
    const bobV2 = await bootstrap('bob');
    expect(h.users.get('bob')!.identity).toBeTruthy();

    // Simulate time passing so alice's per-peer identity-check TTL expires.
    alice.peerCheckedAt.delete('bob');

    const m2 = await runAs('alice', () => alice.encryptMessage('bob', 'v2'));
    // The old session must be gone and a fresh X3DH handshake performed.
    expect(await alice.hasSession('bob')).toBe(true);

    // v1 content is unreadable on v2 (no shared history without a recovery
    // backup — by design), but the conversation continues under new keys.
    expect(m1).toBeTruthy();
    await expect(bobV2.decryptMessage('alice', m2)).resolves.toBe('v2');

    // And the fresh session keeps ratcheting.
    const m3 = await runAs('bob', () => bobV2.encryptMessage('alice', 'v2 ack'));
    expect(await alice.decryptMessage('bob', m3)).toBe('v2 ack');
  }, 30_000);

  it('keeps the existing session when the identity endpoint is unreachable', async () => {
    const alice = await bootstrap('alice');
    const bob = await bootstrap('bob');

    const m1 = await runAs('alice', () => alice.encryptMessage('bob', 'one'));
    expect(await bob.decryptMessage('alice', m1)).toBe('one');
    const m2 = await runAs('bob', () => bob.encryptMessage('alice', 'two'));
    expect(await alice.decryptMessage('bob', m2)).toBe('two');

    // Identity check fails (offline) — pre-send check must fall back to the
    // existing session rather than destroy it.
    h.state.identityDown = true;
    alice.peerCheckedAt.delete('bob');
    const m3 = await runAs('alice', () => alice.encryptMessage('bob', 'three'));
    expect(await bob.decryptMessage('alice', m3)).toBe('three');
    expect(await alice.hasSession('bob')).toBe(true);
  }, 30_000);
});
