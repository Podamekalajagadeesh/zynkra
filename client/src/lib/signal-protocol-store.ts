/**
 * IndexedDB-backed Signal Protocol Store.
 * Persists identity keys, pre-keys, signed pre-keys, and sessions
 * so they survive page reloads.
 *
 * Runtime types come from the ambient declaration in types/libsignal.d.ts —
 * no static import from the CJS package (which can't be bundled by Vite).
 */

// Local type aliases referencing the ambient module declaration.
type KeyPairType = import('@privacyresearch/libsignal-protocol-typescript').KeyPairType;
type SignalProtocolStore = import('@privacyresearch/libsignal-protocol-typescript').SignalProtocolStore;

const DB_NAME = 'zynkra-e2ee';
const DB_VERSION = 1;

interface IdentityRecord {
  identifier: string;
  publicKey: ArrayBuffer;
}

interface IdentityKeyPairRecord {
  userId?: string;
  privKey: ArrayBuffer;
  pubKey: ArrayBuffer;
}

interface SessionRecord {
  identifier: string;
  record: string;
}

interface PreKeyRecord {
  keyId: number;
  keyPair: {
    privKey: ArrayBuffer;
    pubKey: ArrayBuffer;
  };
}

interface SignedPreKeyRecord {
  keyId: number;
  keyPair: {
    privKey: ArrayBuffer;
    pubKey: ArrayBuffer;
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(new Error('Failed to open E2EE IndexedDB'));

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('identityKeys')) {
        db.createObjectStore('identityKeys', { keyPath: 'identifier' });
      }
      if (!db.objectStoreNames.contains('identityKeyPair')) {
        db.createObjectStore('identityKeyPair', { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'identifier' });
      }
      if (!db.objectStoreNames.contains('preKeys')) {
        db.createObjectStore('preKeys', { keyPath: 'keyId' });
      }
      if (!db.objectStoreNames.contains('signedPreKeys')) {
        db.createObjectStore('signedPreKeys', { keyPath: 'keyId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

function storePut<T>(storeName: string, value: T): Promise<void> {
  return openDb().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(value);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  });
}

function storeGet<T>(storeName: string, key: string | number): Promise<T | undefined> {
  return openDb().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const s = tx.objectStore(storeName);
      const req = s.get(key);
      req.onsuccess = () => {
        db.close();
        resolve(req.result as T | undefined);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  });
}

function storeDelete(storeName: string, key: string | number): Promise<void> {
  return openDb().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const s = tx.objectStore(storeName);
      s.delete(key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  });
}

function storeClear(storeName: string): Promise<void> {
  return openDb().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const s = tx.objectStore(storeName);
      s.clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  });
}

export function createSignalProtocolStore(userId: string): SignalProtocolStore {
  const store: SignalProtocolStore & {
    _userId: string;
    _initialize: (identityKeyPair: KeyPairType, registrationId: number) => Promise<void>;
  } = {
    _userId: userId,

    async _initialize(
      identityKeyPair: KeyPairType,
      registrationId: number,
    ): Promise<void> {
      await storePut<IdentityKeyPairRecord>('identityKeyPair', {
        ...identityKeyPair,
      } as IdentityKeyPairRecord);
      await storePut<{ userId: string; registrationId: number }>(
        'identityKeyPair',
        { userId: this._userId, registrationId } as never,
      );
      // Store registration ID separately
      localStorage.setItem(
        `signal_regid_${userId}`,
        JSON.stringify(registrationId),
      );
    },

    async getIdentityKeyPair(): Promise<KeyPairType | undefined> {
      const record = await storeGet<IdentityKeyPairRecord>(
        'identityKeyPair',
        this._userId,
      );
      if (!record) {
        // Fallback: check without userId key
        const all = await openDb().then((db) => {
          return new Promise<IdentityKeyPairRecord | undefined>((resolve) => {
            const tx = db.transaction('identityKeyPair', 'readonly');
            const req = tx.objectStore('identityKeyPair').getAll();
            req.onsuccess = () => {
              db.close();
              resolve(req.result[0]);
            };
            req.onerror = () => {
              db.close();
              resolve(undefined);
            };
          });
        });
        if (all) {
          return { privKey: all.privKey, pubKey: all.pubKey };
        }
        return undefined;
      }
      return { privKey: record.privKey, pubKey: record.pubKey };
    },

    async getLocalRegistrationId(): Promise<number> {
      const val = localStorage.getItem(`signal_regid_${this._userId}`);
      if (val) return JSON.parse(val);
      // Fallback: generate one
      const id = Math.floor(Math.random() * 16384) + 1;
      localStorage.setItem(
        `signal_regid_${this._userId}`,
        JSON.stringify(id),
      );
      return id;
    },

    async isTrustedIdentity(
      _identifier: string,
      _identityKey: ArrayBuffer,
      _direction: number,
    ): Promise<boolean> {
      // Trust on first use (TOFU) — in production, add out-of-band verification
      return true;
    },

    async saveIdentity(
      identifier: string,
      identityKey: ArrayBuffer,
    ): Promise<boolean> {
      const existing = await storeGet<IdentityRecord>('identityKeys', identifier);
      await storePut<IdentityRecord>('identityKeys', { identifier, publicKey: identityKey });
      return !existing;
    },

    async loadPreKey(keyId: number): Promise<KeyPairType | undefined> {
      const record = await storeGet<PreKeyRecord>('preKeys', keyId);
      return record
        ? { privKey: record.keyPair.privKey, pubKey: record.keyPair.pubKey }
        : undefined;
    },

    async storePreKey(keyId: number, keyPair: KeyPairType): Promise<void> {
      await storePut<PreKeyRecord>('preKeys', {
        keyId,
        keyPair: { privKey: keyPair.privKey, pubKey: keyPair.pubKey },
      });
    },

    async removePreKey(keyId: number): Promise<void> {
      await storeDelete('preKeys', keyId);
    },

    async loadSignedPreKey(keyId: number): Promise<KeyPairType | undefined> {
      const record = await storeGet<SignedPreKeyRecord>('signedPreKeys', keyId);
      return record
        ? { privKey: record.keyPair.privKey, pubKey: record.keyPair.pubKey }
        : undefined;
    },

    async storeSignedPreKey(keyId: number, keyPair: KeyPairType): Promise<void> {
      await storePut<SignedPreKeyRecord>('signedPreKeys', {
        keyId,
        keyPair: { privKey: keyPair.privKey, pubKey: keyPair.pubKey },
      });
    },

    async loadSession(identifier: string): Promise<string | undefined> {
      const record = await storeGet<SessionRecord>('sessions', identifier);
      return record?.record;
    },

    async storeSession(identifier: string, record: string): Promise<void> {
      await storePut<SessionRecord>('sessions', { identifier, record });
    },

    async removeSession(identifier: string): Promise<void> {
      await storeDelete('sessions', identifier);
    },

    async removeAllSessions(identifier: string): Promise<void> {
      await storeClear('sessions');
    },

    // Legacy alias for put — required by some library versions
    put: async (key: string, value: unknown): Promise<void> => {
      // Map keys to appropriate stores
      if (key.startsWith('session-')) {
        const identifier = key.slice(8);
        await storePut<SessionRecord>('sessions', {
          identifier,
          record: JSON.stringify(value),
        });
      }
    },
  };

  return store;
}

/**
 * Persist this device's identity key pair.
 *
 * Critical: without this the identity exists only in memory — every page load
 * would generate a fresh identity, upload it (rotating on the server), and
 * orphan every established session. Called immediately after first-time
 * generation and again after a recovery import.
 */
export async function saveIdentityKeyPair(
  userId: string,
  keyPair: { privKey: ArrayBuffer; pubKey: ArrayBuffer },
): Promise<void> {
  await storePut<IdentityKeyPairRecord>('identityKeyPair', {
    userId,
    privKey: keyPair.privKey,
    pubKey: keyPair.pubKey,
  });
}

function readAllRecords<T>(storeName: string): Promise<T[]> {
  return openDb().then(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => {
          db.close();
          resolve(req.result as T[]);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      }),
  );
}

/** Everything needed to resume as this device on another machine. */
export interface E2eeStoreSnapshot {
  identityKeyPair: { privKey: ArrayBuffer; pubKey: ArrayBuffer } | null;
  registrationId: number | null;
  peerIdentities: Array<{ identifier: string; publicKey: ArrayBuffer }>;
  sessions: Array<{ identifier: string; record: string }>;
  signedPreKeys: Array<{
    keyId: number;
    keyPair: { privKey: ArrayBuffer; pubKey: ArrayBuffer };
  }>;
  preKeys: Array<{
    keyId: number;
    keyPair: { privKey: ArrayBuffer; pubKey: ArrayBuffer };
  }>;
}

/**
 * Read the full E2EE store for recovery export: identity (the root of trust),
 * session records (the ratchet state — without them history is undecryptable),
 * peer identities, and the private pre-key material needed to process
 * in-flight PreKeyWhisperMessages.
 */
export async function collectE2eeStoreData(
  userId: string,
): Promise<E2eeStoreSnapshot> {
  const identity = await storeGet<IdentityKeyPairRecord>(
    'identityKeyPair',
    userId,
  );
  let registrationId: number | null = null;
  try {
    const raw = localStorage.getItem(`signal_regid_${userId}`);
    if (raw) registrationId = JSON.parse(raw);
  } catch {
    // Corrupt reg-id is recoverable — it's regenerated lazily.
  }

  return {
    identityKeyPair: identity
      ? { privKey: identity.privKey, pubKey: identity.pubKey }
      : null,
    registrationId,
    peerIdentities: await readAllRecords<{
      identifier: string;
      publicKey: ArrayBuffer;
    }>('identityKeys'),
    sessions: await readAllRecords<{ identifier: string; record: string }>(
      'sessions',
    ),
    signedPreKeys: await readAllRecords<{
      keyId: number;
      keyPair: { privKey: ArrayBuffer; pubKey: ArrayBuffer };
    }>('signedPreKeys'),
    preKeys: await readAllRecords<{
      keyId: number;
      keyPair: { privKey: ArrayBuffer; pubKey: ArrayBuffer };
    }>('preKeys'),
  };
}

/**
 * Replace the local E2EE store with a restored snapshot.
 *
 * Replace, don't merge: rows left over from a different identity generation
 * (a previous device attempt, a half-failed wipe) would poison the restored
 * state — sessions keyed to a peer under an old identity, duplicate keyIds.
 * The identityKeyPair row is keyed by userId, so it overwrites in place.
 */
export async function restoreE2eeStoreData(
  userId: string,
  snapshot: E2eeStoreSnapshot,
): Promise<void> {
  if (!snapshot.identityKeyPair) {
    throw new Error('Backup is missing the identity key');
  }

  for (const storeName of ['identityKeys', 'sessions', 'preKeys', 'signedPreKeys']) {
    await storeClear(storeName);
  }

  await saveIdentityKeyPair(userId, snapshot.identityKeyPair);
  if (snapshot.registrationId != null) {
    localStorage.setItem(
      `signal_regid_${userId}`,
      JSON.stringify(snapshot.registrationId),
    );
  }

  for (const row of snapshot.peerIdentities) {
    await storePut<IdentityRecord>('identityKeys', row);
  }
  for (const row of snapshot.sessions) {
    await storePut<SessionRecord>('sessions', row);
  }
  for (const row of snapshot.signedPreKeys) {
    await storePut<SignedPreKeyRecord>('signedPreKeys', row);
  }
  for (const row of snapshot.preKeys) {
    await storePut<PreKeyRecord>('preKeys', row);
  }
}

/**
 * Load the identity key we last trusted for a peer (saved by SessionBuilder
 * during `processPreKeyBundle`). Used by rotation detection: compare against
 * the server's current identity for that user and tear the session down on
 * change instead of ratcheting toward a key the peer no longer holds.
 *
 * `identifier` is the SignalProtocolAddress string form: `${userId}.${deviceId}`.
 */
export async function getPeerIdentityKey(
  identifier: string,
): Promise<ArrayBuffer | null> {
  const record = await storeGet<IdentityRecord>('identityKeys', identifier);
  return record?.publicKey ?? null;
}

/**
 * Clear all E2EE session data (e.g., on logout).
 */
export async function clearE2eeData(): Promise<void> {
  const db = await openDb();
  const stores = ['identityKeys', 'identityKeyPair', 'sessions', 'preKeys', 'signedPreKeys'];
  const tx = db.transaction(stores, 'readwrite');
  stores.forEach((name) => {
    const s = tx.objectStore(name);
    s.clear();
  });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
