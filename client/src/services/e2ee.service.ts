/**
 * E2EE Service — high-level Signal Protocol integration.
 *
 * Handles:
 *  - Key generation (identity, signed pre-key, one-time pre-keys)
 *  - PreKey bundle upload/download to server
 *  - Session establishment (X3DH via SessionBuilder)
 *  - Message encryption/decryption (Double Ratchet via SessionCipher)
 *  - Forward secrecy through automatic ratchet advancement
 *
 * Runtime types are provided by the ambient module declaration in types/libsignal.d.ts.
 * The actual library is imported dynamically at runtime only — never at build time —
 * because the CJS package (curve25519, signal-protocol-address, etc.) can't be bundled
 * by Vite/Rollup. If the dependency is not installed, E2EE functions throw a clear error.
 */
import {
  createSignalProtocolStore,
  getPeerIdentityKey,
  saveIdentityKeyPair,
  collectE2eeStoreData,
  restoreE2eeStoreData,
} from '../lib/signal-protocol-store';
import { encryptRecoveryPackage, decryptRecoveryPackage } from '../lib/e2ee-recovery';
import { decidePeerRotation, PEER_IDENTITY_CHECK_TTL_MS } from '../lib/e2ee-rotation';
import { api } from '../lib/api';
import type {
  PreKeyPairType,
  PreKeyBundleType,
} from '@privacyresearch/libsignal-protocol-typescript';

// Lazy-loaded Signal Protocol module (runtime only, not bundled).
// @vite-ignore tells Vite/Rollup to skip resolving this import at build time.
let _libsignal: any = null;
async function getLibsignal() {
  if (_libsignal) return _libsignal;
  try {
    _libsignal = await import(/* @vite-ignore */ '@privacyresearch/libsignal-protocol-typescript');
    return _libsignal;
  } catch {
    throw new Error(
      'Signal Protocol library is not available. E2EE is disabled — ' +
        'install @privacyresearch/libsignal-protocol-typescript to enable it.'
    );
  }
}

// Number of one-time pre-keys to generate and upload in a batch
const PREKEY_BATCH_SIZE = 20;
const SIGNED_PREKEY_ID = 1;

export class E2EEService {
  private store: ReturnType<typeof createSignalProtocolStore> | null = null;
  private userId: string | null = null;
  /** Per-peer epoch ms of the last server-side identity check (rotation detection). */
  private peerCheckedAt = new Map<string, number>();

  /**
   * Initialize the E2EE service for a given user.
   * Generates keys if none exist, uploads them to server, and prepares
   * the local Signal Protocol store.
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    this.store = createSignalProtocolStore(userId);

    // Check if identity key already exists
    const existingKeyPair = await this.store.getIdentityKeyPair();

    if (!existingKeyPair) {
      // First-time setup: generate all keys
      await this.generateAndUploadKeys();
    } else {
      // Re-publish identity FIRST if it diverged from the server: an identity
      // change purges the server's old pre-keys, so the replenish step below
      // must run after, not before, or the batch would be purged with them.
      await this.syncSelfIdentity();
      // Refresh one-time pre-keys if running low
      await this.refreshPreKeys();
    }
  }

  /**
   * Generate identity key, signed pre-key, and one-time pre-keys,
   * then upload them to the server.
   */
  private async generateAndUploadKeys(): Promise<void> {
    if (!this.store || !this.userId) throw new Error('E2EE not initialized');

    const libsignal = await getLibsignal();

    // 1. Generate identity key pair
    const identityKeyPair = await libsignal.KeyHelper.generateIdentityKeyPair();

    // Persist IMMEDIATELY — an in-memory-only identity would regenerate on
    // every page load, rotating on the server and orphaning all sessions.
    await saveIdentityKeyPair(this.userId, identityKeyPair);

    // 2. Generate signed pre-key
    const signedPreKey = await libsignal.KeyHelper.generateSignedPreKey(
      identityKeyPair,
      SIGNED_PREKEY_ID
    );

    // 3. Generate one-time pre-keys
    const oneTimePreKeys: PreKeyPairType[] = [];
    for (let i = 0; i < PREKEY_BATCH_SIZE; i++) {
      const preKey = await libsignal.KeyHelper.generatePreKey(i + 2); // start from keyId 2
      oneTimePreKeys.push(preKey);
    }

    // 4. Store locally
    await this.store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
    for (const pk of oneTimePreKeys) {
      await this.store.storePreKey(pk.keyId, pk.keyPair);
    }

    // 5. Upload to server
    const identityKeyB64 = arrayBufferToBase64(identityKeyPair.pubKey);

    try {
      await api.post('/keys/identity', { identityKey: identityKeyB64 });

      const signedPreKeyB64 = arrayBufferToBase64(signedPreKey.keyPair.pubKey);
      const signedPreKeySigB64 = arrayBufferToBase64(signedPreKey.signature);
      await api.post('/keys/signed-prekey', {
        keyId: signedPreKey.keyId,
        publicKey: signedPreKeyB64,
        signature: signedPreKeySigB64,
      });

      const preKeysPayload = oneTimePreKeys.map((pk) => ({
        keyId: pk.keyId,
        publicKey: arrayBufferToBase64(pk.keyPair.pubKey),
      }));
      await api.post('/keys/one-time-prekeys', { preKeys: preKeysPayload });
    } catch (err) {
      console.warn('E2EE: PreKey upload failed, will retry later:', err);
      // Store locally so messaging still works once keys are uploaded
    }
  }

  /**
   * Check remaining pre-key count and upload a new batch if needed.
   */
  private async refreshPreKeys(): Promise<void> {
    if (!this.userId) return;

    try {
      const res = await api.get('/keys/prekey-count');
      const count = (res.data as { count: number }).count ?? 0;

      if (count < 5) {
        const libsignal = await getLibsignal();
        const oneTimePreKeys: PreKeyPairType[] = [];
        for (let i = 0; i < PREKEY_BATCH_SIZE; i++) {
          const pk = await libsignal.KeyHelper.generatePreKey(
            Math.floor(Math.random() * 100000) + 100
          );
          oneTimePreKeys.push(pk);
        }

        for (const pk of oneTimePreKeys) {
          await this.store!.storePreKey(pk.keyId, pk.keyPair);
        }

        const preKeysPayload = oneTimePreKeys.map((pk) => ({
          keyId: pk.keyId,
          publicKey: arrayBufferToBase64(pk.keyPair.pubKey),
        }));
        await api.post('/keys/one-time-prekeys', { preKeys: preKeysPayload });
      }
    } catch {
      // Server might not be reachable — offline mode
    }
  }

  /**
   * Self-heal the server's copy of this device's identity material.
   *
   * The local store holds the private keys, so on any divergence the local
   * copy wins: if the server reports a *different* identity (a stale copy
   * from a failed/partial upload, or a restored device) or has none at all
   * (404 — first upload never landed), re-publish the identity key and a
   * freshly signed pre-key. Peers re-establish via X3DH on their side
   * (rotation event), so divergence is safe to correct in place.
   */
  private async syncSelfIdentity(): Promise<void> {
    if (!this.store || !this.userId) return;

    const keyPair = await this.store.getIdentityKeyPair();
    if (!keyPair) return;
    const localB64 = arrayBufferToBase64(keyPair.pubKey);

    try {
      const res = await api.get(`/keys/identity/${this.userId}`);
      const remote = (res.data as { publicKey?: string }).publicKey;
      if (remote === localB64) return;
      console.warn('E2EE: server identity differs from local — re-publishing');
    } catch {
      // Missing on server (404) or unreachable — attempt the upload anyway;
      // if we're offline it fails soft and is retried on next initialize.
    }

    try {
      await api.post('/keys/identity', { identityKey: localB64 });

      // Signature over the signed pre-key must be made with the identity
      // private key; regenerate the SPK (same keyId → server upserts, other
      // peers pick it up on their next session establishment).
      const libsignal = await getLibsignal();
      const spk = await libsignal.KeyHelper.generateSignedPreKey(keyPair, SIGNED_PREKEY_ID);
      await this.store.storeSignedPreKey(spk.keyId, spk.keyPair);
      await api.post('/keys/signed-prekey', {
        keyId: spk.keyId,
        publicKey: arrayBufferToBase64(spk.keyPair.pubKey),
        signature: arrayBufferToBase64(spk.signature),
      });
    } catch (err) {
      console.warn('E2EE: identity self-sync failed (will retry):', err);
    }
  }

  /**
   * Guarantee the session with `recipientUserId` is aimed at their *current*
   * identity key before sending.
   *
   *  - No session → establish one (X3DH).
   *  - Session exists → throttled check of the server's identity for the peer
   *    against the identity cached when the session was built. On mismatch the
   *    peer rotated their keys (new install / compromise response): the old
   *    session is torn down and rebuilt from a fresh pre-key bundle, because
   *    ratcheting further would produce ciphertext they can no longer decrypt.
   *  - Server unreachable → keep the existing session (offline tolerance).
   */
  async ensureFreshSession(recipientUserId: string): Promise<void> {
    if (!this.store || !this.userId) throw new Error('E2EE not initialized');

    const libsignal = await getLibsignal();
    const address = new libsignal.SignalProtocolAddress(recipientUserId, 1);
    const existing = await this.store.loadSession(address.toString());
    if (!existing) {
      await this.establishSession(recipientUserId);
      return;
    }

    const now = Date.now();
    const lastCheckedAt = this.peerCheckedAt.get(recipientUserId) ?? 0;
    if (lastCheckedAt > 0 && now - lastCheckedAt < PEER_IDENTITY_CHECK_TTL_MS) {
      return;
    }

    let remoteKey: string | null = null;
    try {
      const res = await api.get(`/keys/identity/${recipientUserId}`);
      remoteKey = (res.data as { publicKey?: string }).publicKey ?? null;
    } catch {
      remoteKey = null;
    }

    let cachedKey: string | null = null;
    try {
      const cached = await getPeerIdentityKey(address.toString());
      cachedKey = cached ? arrayBufferToBase64(cached) : null;
    } catch {
      cachedKey = null;
    }

    this.peerCheckedAt.set(recipientUserId, now);
    const decision = decidePeerRotation(cachedKey, remoteKey, lastCheckedAt, now);

    if (decision === 'reestablish') {
      console.warn(`E2EE: identity key rotated for ${recipientUserId} — rebuilding session`);
      await this.store.removeSession(address.toString());
      await this.establishSession(recipientUserId);
    }
  }

  /**
   * Establish a session with another user by fetching their PreKey bundle
   * from the server and processing it with SessionBuilder (X3DH).
   * After the session is established, messages can be encrypted/decrypted.
   *
   * The caller must ensure no stale session exists (see `ensureFreshSession`);
   * this method always fetches a *current* bundle, which consumes one of the
   * recipient's one-time pre-keys.
   */
  async establishSession(recipientUserId: string): Promise<void> {
    if (!this.store || !this.userId) throw new Error('E2EE not initialized');

    try {
      // Fetch the recipient's pre-key bundle from server
      const bundle = await api.get(`/keys/bundle/${recipientUserId}`);
      const b = bundle.data as {
        registrationId: number;
        identityKey: string;
        signedPreKey: { keyId: number; publicKey: string; signature: string };
        oneTimePreKey: { keyId: number; publicKey: string } | null;
      };

      const libsignal = await getLibsignal();
      const address = new libsignal.SignalProtocolAddress(recipientUserId, 1);
      const builder = new libsignal.SessionBuilder(this.store, address);

      // Convert base64 fields to ArrayBuffers — DeviceType shape expected by
      // SessionBuilder.processPreKey (identityKey, nested signedPreKey, preKey).
      const preKeyBundle: PreKeyBundleType = {
        registrationId: b.registrationId,
        identityKey: base64ToArrayBuffer(b.identityKey),
        signedPreKey: {
          keyId: b.signedPreKey.keyId,
          publicKey: base64ToArrayBuffer(b.signedPreKey.publicKey),
          signature: base64ToArrayBuffer(b.signedPreKey.signature),
        },
      };

      // Include one-time pre-key if available
      if (b.oneTimePreKey) {
        preKeyBundle.preKey = {
          keyId: b.oneTimePreKey.keyId,
          publicKey: base64ToArrayBuffer(b.oneTimePreKey.publicKey),
        };
      }

      // X3DH key agreement (verifies the signed-prekey signature against the
      // fetched identity key, then persists the session record).
      await builder.processPreKey(preKeyBundle);
    } catch (err) {
      console.error('E2EE: Failed to establish session with', recipientUserId, err);
      throw new Error('Cannot establish encrypted session. User may not have keys published.');
    }
  }

  /**
   * Encrypt a message for a specific recipient.
   * Automatically establishes a session if one doesn't exist.
   * Returns the ciphertext as a base64-encoded string that can be sent via the API.
   */
  async encryptMessage(recipientUserId: string, plaintext: string): Promise<string> {
    if (!this.store) throw new Error('E2EE not initialized');

    const libsignal = await getLibsignal();
    const address = new libsignal.SignalProtocolAddress(recipientUserId, 1);

    // Ensure a session exists AND still targets the recipient's current
    // identity (re-establishes if their keys rotated).
    await this.ensureFreshSession(recipientUserId);

    const cipher = new libsignal.SessionCipher(this.store, address);

    // Encrypt using the Double Ratchet
    const plaintextBuffer = stringToArrayBuffer(plaintext);
    const ciphertext = await cipher.encrypt(plaintextBuffer);

    // The library's `body` is a latin1/binary string; the wire format carries
    // base64 (decoded by the recipient before handing bytes to the library).
    return JSON.stringify({
      type: ciphertext.type,
      body: arrayBufferToBase64(binaryStringToArrayBuffer(ciphertext.body)),
      version: 1,
    });
  }

  /**
   * Decrypt a message from a specific sender.
   * Handles both pre-key whisper messages (first message from a new session)
   * and regular whisper messages (subsequent messages).
   */
  async decryptMessage(senderUserId: string, ciphertextJson: string): Promise<string> {
    if (!this.store) throw new Error('E2EE not initialized');

    const libsignal = await getLibsignal();
    const address = new libsignal.SignalProtocolAddress(senderUserId, 1);
    const cipher = new libsignal.SessionCipher(this.store, address);

    const parsed = JSON.parse(ciphertextJson);
    const ciphertextBuffer = base64ToArrayBuffer(parsed.body);

    try {
      let decrypted: ArrayBuffer;

      if (parsed.type === 3) {
        // PreKeyWhisperMessage: first message in a session
        // No encoding argument: the default ('binary') passes an
        // ArrayBuffer through unchanged — any other value is rejected.
        decrypted = await cipher.decryptPreKeyWhisperMessage(ciphertextBuffer);
      } else {
        // Regular WhisperMessage
        decrypted = await cipher.decryptWhisperMessage(ciphertextBuffer);
      }

      return arrayBufferToString(decrypted);
    } catch (err) {
      console.error('E2EE: Decryption failed for message from', senderUserId, err);
      // The session is unusable (rotated peer, lost state, or corrupted
      // ratchet). Tear it down first so the rebuild starts from a clean slate
      // instead of layering a new X3DH handshake over broken state. The failed
      // message itself still can't be decrypted — the sender must re-send
      // under the new session — so this re-throws after re-establishing.
      try {
        await this.store.removeSession(address.toString());
        this.peerCheckedAt.delete(senderUserId);
      } catch {
        // Fall through — establishSession below rebuilds regardless.
      }
      await this.establishSession(senderUserId);
      throw new Error('Decryption failed. Session may have been lost.');
    }
  }

  /**
   * Check if a session exists with another user.
   */
  async hasSession(recipientUserId: string): Promise<boolean> {
    if (!this.store) return false;
    const libsignal = await getLibsignal();
    const address = new libsignal.SignalProtocolAddress(recipientUserId, 1);
    const record = await this.store.loadSession(address.toString());
    return !!record;
  }

  /**
   * Get the user's identity key (public) as base64 for display/verification.
   */
  async getIdentityKeyB64(): Promise<string | null> {
    if (!this.store) return null;
    const keyPair = await this.store.getIdentityKeyPair();
    if (!keyPair) return null;
    return arrayBufferToBase64(keyPair.pubKey);
  }

  /**
   * This device's key-rotation history from the server (newest first).
   * `since` is an ISO-8601 instant; pass the last seen `createdAt` to sync
   * incrementally — the building block for the recovery/resync story after a
   * device was offline.
   */
  async getRotationEvents(
    since?: string
  ): Promise<
    Array<{ kind: string; keyId: number | null; detail: string | null; createdAt: string }>
  > {
    if (!this.store) throw new Error('E2EE not initialized');
    const qs = since ? `?since=${encodeURIComponent(since)}` : '';
    const res = await api.get(`/keys/rotation-events${qs}`);
    return res.data as Array<{
      kind: string;
      keyId: number | null;
      detail: string | null;
      createdAt: string;
    }>;
  }

  /**
   * Recovery export: wrap the full local E2EE store (identity + session
   * ratchet state + pre-keys) in a passphrase-encrypted envelope, returned as
   * a JSON string for the caller to download. The passphrase never leaves the
   * device; the server never sees any of it.
   */
  async exportRecovery(passphrase: string): Promise<string> {
    if (!this.store || !this.userId) throw new Error('E2EE not initialized');
    const snapshot = await collectE2eeStoreData(this.userId);
    return encryptRecoveryPackage(this.userId, snapshot, passphrase);
  }

  /**
   * Recovery import: decrypt an envelope with the passphrase, replace the
   * local E2EE store, then verify the server's copy of this identity
   * (self-heal if missing/stale). After this the device can decrypt restored
   * session history and continue existing conversations.
   */
  async importRecovery(envelope: string, passphrase: string): Promise<void> {
    if (!this.store || !this.userId) throw new Error('E2EE not initialized');

    const pkg = await decryptRecoveryPackage(envelope, passphrase);
    if (pkg.userId !== this.userId) {
      throw new Error('This backup belongs to a different account. Sign in as that account first.');
    }

    await restoreE2eeStoreData(this.userId, pkg.snapshot);

    // Rebuild in-memory handles — the underlying IndexedDB was replaced.
    this.store = createSignalProtocolStore(this.userId);
    this.peerCheckedAt = new Map();

    await this.syncSelfIdentity();
  }
}

// Singleton instance
let _instance: E2EEService | null = null;

export function getE2EEService(): E2EEService {
  if (!_instance) {
    _instance = new E2EEService();
  }
  return _instance;
}

// --- ArrayBuffer <-> string utilities ---

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** latin1/binary string (as produced by the library) → raw bytes. */
function binaryStringToArrayBuffer(str: string): ArrayBuffer {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes.buffer;
}

function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoded = new TextEncoder().encode(str);
  // Copy into a locally-constructed buffer: in test/jsdom environments
  // TextEncoder may come from another realm, and the Signal library checks
  // `buffer instanceof ArrayBuffer` strictly.
  const bytes = new Uint8Array(encoded.length);
  bytes.set(encoded);
  return bytes.buffer;
}

function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}
