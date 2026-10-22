/**
 * Signal Protocol store — persistence, scoped session removal, and the
 * recovery backup/restore round-trip, against a REAL IndexedDB
 * (fake-indexeddb). Every other E2EE suite mocks this module, so the
 * persistence layer itself — the thing that must survive reloads and
 * restore correctly after import — would otherwise be untested.
 *
 * The regression that motivated the scoped-removal tests: removeAllSessions
 * used to clear the entire sessions table, so one peer rotating keys would
 * destroy every other conversation on the device.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import type { KeyPairType } from '@privacyresearch/libsignal-protocol-typescript';
import {
  createSignalProtocolStore,
  saveIdentityKeyPair,
  getPeerIdentityKey,
  collectE2eeStoreData,
  restoreE2eeStoreData,
  clearE2eeData,
} from './signal-protocol-store';

const USER_ID = 'user-1';

function bytes(...values: number[]): ArrayBuffer {
  const out = new Uint8Array(values.length);
  out.set(values);
  return out.buffer;
}

function keyPair(seed: number): KeyPairType {
  return { privKey: bytes(seed, seed + 1), pubKey: bytes(seed + 2, seed + 3) };
}

async function seedStore() {
  const store = createSignalProtocolStore(USER_ID);
  await saveIdentityKeyPair(USER_ID, keyPair(10));
  localStorage.setItem(`signal_regid_${USER_ID}`, JSON.stringify(4242));
  await store.saveIdentity('peer-a.1', bytes(30, 31));
  await store.saveIdentity('peer-b.1', bytes(40, 41));
  await store.storeSession('peer-a.1', 'session-record-a');
  await store.storeSession('peer-b.1', 'session-record-b');
  await store.storeSignedPreKey(1, keyPair(50));
  await store.storePreKey(2, keyPair(60));
  return store;
}

describe('signal-protocol-store (real IndexedDB)', () => {
  beforeEach(async () => {
    await clearE2eeData();
    localStorage.clear();
  });

  it('round-trips identity keys, pre-keys, and sessions', async () => {
    const store = await seedStore();

    const identity = await store.getIdentityKeyPair();
    expect(identity).toBeTruthy();
    expect(new Uint8Array(identity!.pubKey)).toEqual(new Uint8Array(bytes(12, 13)));
    expect(await store.getLocalRegistrationId()).toBe(4242);

    const preKey = await store.loadPreKey(2);
    expect(new Uint8Array(preKey!.privKey)).toEqual(new Uint8Array(bytes(60, 61)));
    const spk = await store.loadSignedPreKey(1);
    expect(new Uint8Array(spk!.pubKey)).toEqual(new Uint8Array(bytes(52, 53)));

    expect(await store.loadSession('peer-a.1')).toBe('session-record-a');
    expect(await store.loadSession('peer-b.1')).toBe('session-record-b');
  });

  it('saveIdentity writes under the address that rotation detection reads', async () => {
    const store = createSignalProtocolStore(USER_ID);

    expect(await getPeerIdentityKey('peer-a.1')).toBeNull();

    const first = await store.saveIdentity('peer-a.1', bytes(70, 71));
    expect(first).toBe(true);
    expect(new Uint8Array((await getPeerIdentityKey('peer-a.1'))!)).toEqual(
      new Uint8Array(bytes(70, 71))
    );

    // Second write for the same address reports "already existed" and updates
    // the key in place — the peer-rotation signal.
    const second = await store.saveIdentity('peer-a.1', bytes(80, 81));
    expect(second).toBe(false);
    expect(new Uint8Array((await getPeerIdentityKey('peer-a.1'))!)).toEqual(
      new Uint8Array(bytes(80, 81))
    );
  });

  it('removeSession deletes exactly one peer session', async () => {
    const store = await seedStore();

    await store.removeSession('peer-a.1');

    expect(await store.loadSession('peer-a.1')).toBeUndefined();
    expect(await store.loadSession('peer-b.1')).toBe('session-record-b');
  });

  it('removeAllSessions removes only the given peer across devices', async () => {
    const store = await seedStore();
    // Same peer name, second device + an unrelated peer.
    await store.storeSession('peer-a.2', 'session-record-a-dev2');
    await store.storeSession('carol.1', 'session-record-carol');

    await store.removeAllSessions('peer-a.1');

    expect(await store.loadSession('peer-a.1')).toBeUndefined();
    expect(await store.loadSession('peer-a.2')).toBeUndefined();
    expect(await store.loadSession('peer-b.1')).toBe('session-record-b');
    expect(await store.loadSession('carol.1')).toBe('session-record-carol');
  });

  it('removeAllSessions accepts a bare peer name (no device suffix)', async () => {
    const store = await seedStore();

    await store.removeAllSessions('peer-b');

    expect(await store.loadSession('peer-b.1')).toBeUndefined();
    expect(await store.loadSession('peer-a.1')).toBe('session-record-a');
  });

  it('collect → restore replaces (never merges) the store with the snapshot', async () => {
    const store = await seedStore();

    const snapshot = await collectE2eeStoreData(USER_ID);
    expect(snapshot.identityKeyPair).toBeTruthy();
    expect(snapshot.registrationId).toBe(4242);
    expect(snapshot.peerIdentities).toHaveLength(2);
    expect(snapshot.sessions).toHaveLength(2);

    // Contaminate the live store AFTER the snapshot was taken: a leftover row
    // from a different identity generation must not survive the restore.
    await store.storeSession('intruder.1', 'poisoned-session');
    await store.removeSession('peer-a.1');

    await restoreE2eeStoreData(USER_ID, snapshot);

    // Snapshot state is back…
    expect(await store.loadSession('peer-a.1')).toBe('session-record-a');
    expect(await store.loadSession('peer-b.1')).toBe('session-record-b');
    expect(new Uint8Array((await getPeerIdentityKey('peer-a.1'))!)).toEqual(
      new Uint8Array(bytes(30, 31))
    );
    const identity = await store.getIdentityKeyPair();
    expect(new Uint8Array(identity!.privKey)).toEqual(new Uint8Array(bytes(10, 11)));
    expect(await store.getLocalRegistrationId()).toBe(4242);

    // …and the contamination is gone (replace, don't merge).
    expect(await store.loadSession('intruder.1')).toBeUndefined();
  });

  it('restore rejects a backup without an identity key', async () => {
    const snapshot = await collectE2eeStoreData(USER_ID);
    await expect(
      restoreE2eeStoreData(USER_ID, { ...snapshot, identityKeyPair: null })
    ).rejects.toThrow('Backup is missing the identity key');
  });
});
