/**
 * E2EE service — cross-device rotation resilience and the recovery
 * export → import flow, through the REAL Signal Protocol library and the
 * REAL IndexedDB-backed store (fake-indexeddb). Only the key-directory API
 * is faked (in-memory, mirroring server/src/keys behaviour: bundle claims
 * consume one-time pre-keys, identity uploads purge pre-keys).
 *
 * What this proves:
 *  - decrypt-failure teardown: a corrupted/rotated session is removed, the
 *    identity-check throttle is cleared, and a fresh X3DH session is rebuilt
 *    before the error surfaces to the caller,
 *  - recovery: export → wipe ("new device") → import restores the SAME
 *    identity (the server self-heals to it, so contacts never see a
 *    safety-number change) and the restored ratchet state still decrypts
 *    messages sent under the pre-export session,
 *  - guards: a backup for another account is rejected; a wrong passphrase
 *    is rejected without touching the store.
 *
 * @vitest-environment node
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
  interface ServerUser {
    identity: string | null;
    spk: { keyId: number; publicKey: string; signature: string } | null;
    otpks: Array<{ keyId: number; publicKey: string }>;
  }

  const users = new Map<string, ServerUser>();
  const state = { actor: '' };

  const userFor = (userId: string): ServerUser => {
    let u = users.get(userId);
    if (!u) {
      u = { identity: null, spk: null, otpks: [] };
      users.set(userId, u);
    }
    return u;
  };

  return { users, state, userFor };
});

vi.mock('../lib/api', () => ({
  API_BASE_URL: 'http://test.local',
  api: {
    get: vi.fn(async (url: string) => {
      const { users, userFor, state } = h;
      if (url.startsWith('/keys/bundle/')) {
        const userId = url.slice('/keys/bundle/'.length);
        const u = users.get(userId);
        if (!u || !u.identity || !u.spk) {
          throw new Error(`no keys published for ${userId}`);
        }
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
        return { data: { count: userFor(state.actor).otpks.length } };
      }
      if (url.startsWith('/keys/rotation-events')) {
        return { data: [] };
      }
      throw new Error(`unhandled GET ${url}`);
    }),
    post: vi.fn(async (url: string, body: { identityKey?: string; preKeys?: unknown[] }) => {
      const { userFor, state } = h;
      const u = userFor(state.actor);
      if (url === '/keys/identity') {
        u.identity = body.identityKey ?? null;
        // Mirror the server's purge-on-identity-change (prekeys.service.ts).
        u.spk = null;
        u.otpks = [];
        return { data: undefined };
      }
      if (url === '/keys/signed-prekey') {
        u.spk = body as never;
        return { data: undefined };
      }
      if (url === '/keys/one-time-prekeys') {
        u.otpks.push(...((body.preKeys ?? []) as Array<{ keyId: number; publicKey: string }>));
        return { data: { count: u.otpks.length } };
      }
      throw new Error(`unhandled POST ${url}`);
    }),
  },
}));

import { E2EEService } from './e2ee.service';
import { clearE2eeData } from '../lib/signal-protocol-store';

const PASSPHRASE = 'correct horse battery staple';

// Deliberately not an intersection with the class: E2EEService's private
// fields would collapse the type to never.
type Party = {
  initialize: (userId: string) => Promise<void>;
  encryptMessage: (recipientId: string, plaintext: string) => Promise<string>;
  decryptMessage: (senderId: string, ciphertextJson: string) => Promise<string>;
  hasSession: (userId: string) => Promise<boolean>;
  getIdentityKeyB64: () => Promise<string | null>;
  exportRecovery: (passphrase: string) => Promise<string>;
  importRecovery: (envelope: string, passphrase: string) => Promise<void>;
  peerCheckedAt: Map<string, number>;
  store: {
    loadSession: (identifier: string) => Promise<string | undefined>;
    storeSession: (identifier: string, record: string) => Promise<void>;
  };
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

beforeEach(async () => {
  h.users.clear();
  h.state.actor = '';
  vi.clearAllMocks();
  await clearE2eeData();
  localStorage.clear();
});

describe('E2EE service — rotation resilience & recovery (real store)', () => {
  it('tears down and rebuilds the session after a decryption failure', async () => {
    const alice = await bootstrap('alice');
    const bob = await bootstrap('bob');

    const m1 = await runAs('alice', () => alice.encryptMessage('bob', 'hello bob'));
    expect(await bob.decryptMessage('alice', m1)).toBe('hello bob');

    // Corrupt bob's session with alice (simulates lost/corrupted ratchet
    // state) and arm the identity-check throttle so the teardown must clear it.
    await bob.store.storeSession('alice.1', 'corrupted-session-record');
    bob.peerCheckedAt.set('alice', Date.now());

    await expect(bob.decryptMessage('alice', m1)).rejects.toThrow(
      'Decryption failed. Session may have been lost.'
    );

    // The corrupted record is gone, a fresh X3DH session was rebuilt from a
    // new bundle fetch, and the rotation-check throttle was reset.
    expect(bob.peerCheckedAt.has('alice')).toBe(false);
    const rebuilt = await bob.store.loadSession('alice.1');
    expect(rebuilt).toBeTruthy();
    expect(rebuilt).not.toBe('corrupted-session-record');
    expect(await bob.hasSession('alice')).toBe(true);
  }, 30_000);

  it('restores identity, server copy, and in-flight history via export → import', async () => {
    const alice = await bootstrap('alice');
    const bob = await bootstrap('bob');
    const originalIdentity = (await alice.getIdentityKeyB64())!;

    const m1 = await runAs('alice', () => alice.encryptMessage('bob', 'first contact'));
    expect(await bob.decryptMessage('alice', m1)).toBe('first contact');
    const m2 = await runAs('bob', () => bob.encryptMessage('alice', 'reply before export'));
    expect(await alice.decryptMessage('bob', m2)).toBe('reply before export');

    const envelope = await alice.exportRecovery(PASSPHRASE);

    // "New device": all local E2EE state is gone.
    await clearE2eeData();
    localStorage.clear();

    const alice2 = new E2EEService() as unknown as Party;
    // First boot on the new device generates and uploads a THROWAWAY identity
    // (the normal first-run path)…
    await runAs('alice', () => alice2.initialize('alice'));
    // …then the user restores the backup.
    await runAs('alice', () => alice2.importRecovery(envelope, PASSPHRASE));

    // Same identity as before — locally and on the server (syncSelfIdentity
    // re-published the restored key), so contacts never see a safety-number
    // change.
    expect(await alice2.getIdentityKeyB64()).toBe(originalIdentity);
    expect(h.users.get('alice')!.identity).toBe(originalIdentity);

    // The restored ratchet state decrypts a message sent under the
    // pre-export session: history and live conversation both survive.
    expect(await alice2.hasSession('bob')).toBe(true);
    const m3 = await runAs('bob', () => bob.encryptMessage('alice', 'after restore'));
    await expect(alice2.decryptMessage('bob', m3)).resolves.toBe('after restore');
  }, 30_000);

  it('rejects importing a backup that belongs to a different account', async () => {
    const alice = await bootstrap('alice');
    const envelope = await alice.exportRecovery(PASSPHRASE);

    const bob = await bootstrap('bob');
    await expect(runAs('bob', () => bob.importRecovery(envelope, PASSPHRASE))).rejects.toThrow(
      'This backup belongs to a different account. Sign in as that account first.'
    );
  }, 30_000);

  it('rejects a wrong passphrase without touching the store', async () => {
    const alice = await bootstrap('alice');
    const envelope = await alice.exportRecovery(PASSPHRASE);
    const identityBefore = (await alice.getIdentityKeyB64())!;

    await expect(
      runAs('alice', () => alice.importRecovery(envelope, 'wrong passphrase!'))
    ).rejects.toThrow('Incorrect passphrase or corrupted backup');

    expect(await alice.getIdentityKeyB64()).toBe(identityBefore);
  }, 30_000);
});
