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
import { createSignalProtocolStore } from '../lib/signal-protocol-store';
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
      'install @privacyresearch/libsignal-protocol-typescript to enable it.',
    );
  }
}

// Number of one-time pre-keys to generate and upload in a batch
const PREKEY_BATCH_SIZE = 20;
const SIGNED_PREKEY_ID = 1;

export class E2EEService {
  private store: ReturnType<typeof createSignalProtocolStore> | null = null;
  private userId: string | null = null;

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
    const identityKeyPair = await libsignal.generateIdentityKeyPair();

    // 2. Generate signed pre-key
    const signedPreKey = await libsignal.generateSignedPreKey(
      identityKeyPair,
      SIGNED_PREKEY_ID,
    );

    // 3. Generate one-time pre-keys
    const oneTimePreKeys: PreKeyPairType[] = [];
    for (let i = 0; i < PREKEY_BATCH_SIZE; i++) {
      const preKey = await libsignal.generatePreKey(i + 2); // start from keyId 2
      oneTimePreKeys.push(preKey);
    }

    // 4. Store locally
    await this.store.storeSignedPreKey(
      signedPreKey.keyId,
      signedPreKey.keyPair,
    );
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
          const pk = await libsignal.generatePreKey(
            Math.floor(Math.random() * 100000) + 100,
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
   * Establish a session with another user by fetching their PreKey bundle
   * from the server and processing it with SessionBuilder (X3DH).
   * After the session is established, messages can be encrypted/decrypted.
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

      // Convert base64 fields to ArrayBuffers for the Signal Protocol library
      const preKeyBundle: PreKeyBundleType = {
        registrationId: b.registrationId,
        deviceId: 1,
        identityKey: base64ToArrayBuffer(b.identityKey),
        signedPreKeyId: b.signedPreKey.keyId,
        signedPreKey: base64ToArrayBuffer(b.signedPreKey.publicKey),
        signedPreKeySignature: base64ToArrayBuffer(b.signedPreKey.signature),
      };

      // Include one-time pre-key if available
      if (b.oneTimePreKey) {
        preKeyBundle.preKeyId = b.oneTimePreKey.keyId;
        preKeyBundle.preKey = base64ToArrayBuffer(b.oneTimePreKey.publicKey);
      }

      // Process the pre-key bundle (X3DH key agreement)
      await builder.processPreKeyBundle(preKeyBundle);
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
  async encryptMessage(
    recipientUserId: string,
    plaintext: string,
  ): Promise<string> {
    if (!this.store) throw new Error('E2EE not initialized');

    const libsignal = await getLibsignal();
    const address = new libsignal.SignalProtocolAddress(recipientUserId, 1);

    // Check if session exists, if not, establish one
    const sessionRecord = await this.store.loadSession(address.toString());

    if (!sessionRecord) {
      await this.establishSession(recipientUserId);
    }

    const cipher = new libsignal.SessionCipher(this.store, address);

    // Encrypt using the Double Ratchet
    const plaintextBuffer = stringToArrayBuffer(plaintext);
    const ciphertext = await cipher.encrypt(plaintextBuffer);

    // Return as JSON with type info so the recipient knows how to decrypt
    return JSON.stringify({
      type: ciphertext.type,
      body: ciphertext.body,
      version: 1,
    });
  }

  /**
   * Decrypt a message from a specific sender.
   * Handles both pre-key whisper messages (first message from a new session)
   * and regular whisper messages (subsequent messages).
   */
  async decryptMessage(
    senderUserId: string,
    ciphertextJson: string,
  ): Promise<string> {
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
        decrypted = await cipher.decryptPreKeyWhisperMessage(
          ciphertextBuffer,
          'base64',
        );
      } else {
        // Regular WhisperMessage
        decrypted = await cipher.decryptWhisperMessage(
          ciphertextBuffer,
          'base64',
        );
      }

      return arrayBufferToString(decrypted);
    } catch (err) {
      console.error('E2EE: Decryption failed for message from', senderUserId, err);
      // Attempt session re-establishment
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

function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}
