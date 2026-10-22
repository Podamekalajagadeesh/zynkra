/**
 * Passphrase-protected E2EE recovery backup.
 *
 * The recovery story for 1:1 E2EE: export this device's complete key state —
 * identity key pair, session ratchet records (without them, message history is
 * permanently unreadable), trusted peer identities, and pre-key private
 * material — as a single file encrypted with a user passphrase. On a new
 * device, importing it restores history and keeps the SAME identity, so peers
 * never see a safety-number change.
 *
 * Construction:
 *  - KDF: PBKDF2-HMAC-SHA256 via WebCrypto with a per-backup random salt at a
 *    hardened iteration count (the libsodium build bundled here does not
 *    ship Argon2). Params travel inside the envelope so they can be raised
 *    over time.
 *  - AEAD: XChaCha20-Poly1305 with a random nonce (same primitive family as
 *    attachment encryption — one audited stack across the product).
 *
 * The passphrase is typed by the user, never transmitted, and never stored:
 * losing it means losing the backup (by design — there is no server-side
 * escrow that could decrypt it).
 */
import libsodium from 'libsodium-wrappers';
import type { E2eeStoreSnapshot } from './signal-protocol-store';

/** OWASP-recommended PBKDF2-HMAC-SHA256 iteration count (2023). */
export const RECOVERY_PBKDF2_ITERATIONS = 600_000;
/** Envelope sanity bounds — a crafted file must not be able to pin the CPU. */
const MIN_ITERATIONS = 1_000;
const MAX_ITERATIONS = 5_000_000;

let sodium: typeof libsodium | null = null;

async function getSodium() {
  if (!sodium) {
    await libsodium.ready;
    sodium = libsodium;
  }
  return sodium;
}

export const RECOVERY_ENVELOPE_VERSION = 1 as const;
export const RECOVERY_ENVELOPE_ALG = 'pbkdf2-sha256+xchacha20poly1305-ietf';

/** JSON-safe mirror of the snapshot: every ArrayBuffer becomes base64. */
export interface SerializedRecoveryPackage {
  v: typeof RECOVERY_ENVELOPE_VERSION;
  userId: string;
  exportedAt: string;
  snapshot: {
    identityKeyPair: { privKey: string; pubKey: string } | null;
    registrationId: number | null;
    peerIdentities: Array<{ identifier: string; publicKey: string }>;
    sessions: Array<{ identifier: string; record: string }>;
    signedPreKeys: Array<{ keyId: number; keyPair: { privKey: string; pubKey: string } }>;
    preKeys: Array<{ keyId: number; keyPair: { privKey: string; pubKey: string } }>;
  };
}

/** The downloadable file's content: KDF/AEAD parameters + ciphertext. */
export interface RecoveryEnvelope {
  v: typeof RECOVERY_ENVELOPE_VERSION;
  alg: typeof RECOVERY_ENVELOPE_ALG;
  iter: number;
  salt: string;
  nonce: string;
  ciphertext: string;
}

export interface DecryptedRecoveryPackage {
  userId: string;
  exportedAt: string;
  snapshot: E2eeStoreSnapshot;
}

function b64(s: typeof libsodium, bytes: Uint8Array): string {
  return s.to_base64(bytes);
}

/**
 * Copy any ArrayBuffer view into a Uint8Array of *this* realm.
 *
 * Under jsdom, values produced by foreign-realm constructors (e.g. what
 * libsodium's `from_string`/`from_base64` hand back) fail libsodium's own
 * `instanceof Uint8Array` input checks. Copying element-wise lands in the
 * calling realm and satisfies both sides.
 */
function norm(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(bytes);
}

function utf8Bytes(text: string): Uint8Array<ArrayBuffer> {
  const src = new TextEncoder().encode(text);
  const out = new Uint8Array(src.length);
  out.set(src);
  return out;
}

/**
 * PBKDF2-HMAC-SHA256 → 32-byte AEAD key (WebCrypto).
 */
async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto is unavailable — cannot open recovery backup');
  }
  const material = await subtle.importKey(
    'raw',
    utf8Bytes(passphrase),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: norm(salt).slice().buffer as ArrayBuffer,
      iterations,
      hash: 'SHA-256',
    },
    material,
    256,
  );
  return new Uint8Array(bits);
}

/**
 * Snapshot → JSON-safe form (pure — unit-testable without IndexedDB).
 */
export function serializeSnapshot(userId: string, snapshot: E2eeStoreSnapshot): SerializedRecoveryPackage {
  if (!snapshot.identityKeyPair) {
    throw new Error('Nothing to export — this device has no E2EE identity key yet');
  }
  const enc = (buf: ArrayBuffer) => {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  return {
    v: RECOVERY_ENVELOPE_VERSION,
    userId,
    exportedAt: new Date().toISOString(),
    snapshot: {
      identityKeyPair: {
        privKey: enc(snapshot.identityKeyPair.privKey),
        pubKey: enc(snapshot.identityKeyPair.pubKey),
      },
      registrationId: snapshot.registrationId,
      peerIdentities: snapshot.peerIdentities.map((p) => ({
        identifier: p.identifier,
        publicKey: enc(p.publicKey),
      })),
      sessions: snapshot.sessions.map((x) => ({ ...x })),
      signedPreKeys: snapshot.signedPreKeys.map((k) => ({
        keyId: k.keyId,
        keyPair: { privKey: enc(k.keyPair.privKey), pubKey: enc(k.keyPair.pubKey) },
      })),
      preKeys: snapshot.preKeys.map((k) => ({
        keyId: k.keyId,
        keyPair: { privKey: enc(k.keyPair.privKey), pubKey: enc(k.keyPair.pubKey) },
      })),
    },
  };
}

/**
 * JSON-safe form → snapshot (pure). Strict validation: a structurally broken
 * package must fail here, not halfway through an IndexedDB restore.
 */
export function deserializeSnapshot(pkg: SerializedRecoveryPackage): E2eeStoreSnapshot {
  const invalid = () => new Error('Recovery file is not a valid Zynkra backup');
  if (
    !pkg ||
    pkg.v !== RECOVERY_ENVELOPE_VERSION ||
    typeof pkg.userId !== 'string' ||
    !pkg.userId ||
    !pkg.snapshot
  ) {
    throw invalid();
  }
  const snap = pkg.snapshot;
  const dec = (value: unknown): ArrayBuffer => {
    if (typeof value !== 'string') throw invalid();
    try {
      const binary = atob(value);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes.buffer;
    } catch {
      throw invalid();
    }
  };

  if (!snap.identityKeyPair || typeof snap.identityKeyPair.privKey !== 'string') {
    throw new Error('Backup is missing the identity key');
  }
  if (!Array.isArray(snap.sessions) || !Array.isArray(snap.peerIdentities) ||
      !Array.isArray(snap.signedPreKeys) || !Array.isArray(snap.preKeys)) {
    throw invalid();
  }

  const keyPair = (kp: unknown): { privKey: ArrayBuffer; pubKey: ArrayBuffer } => {
    const k = kp as { privKey?: unknown; pubKey?: unknown };
    if (!k || typeof k.privKey !== 'string' || typeof k.pubKey !== 'string') throw invalid();
    return { privKey: dec(k.privKey), pubKey: dec(k.pubKey) };
  };

  return {
    identityKeyPair: keyPair(snap.identityKeyPair),
    registrationId: typeof snap.registrationId === 'number' ? snap.registrationId : null,
    peerIdentities: snap.peerIdentities.map((p) => {
      if (!p || typeof p.identifier !== 'string') throw invalid();
      return { identifier: p.identifier, publicKey: dec(p.publicKey) };
    }),
    sessions: snap.sessions.map((x) => {
      if (!x || typeof x.identifier !== 'string' || typeof x.record !== 'string') throw invalid();
      return { identifier: x.identifier, record: x.record };
    }),
    signedPreKeys: snap.signedPreKeys.map((k) => {
      if (!k || typeof k.keyId !== 'number') throw invalid();
      return { keyId: k.keyId, keyPair: keyPair(k.keyPair) };
    }),
    preKeys: snap.preKeys.map((k) => {
      if (!k || typeof k.keyId !== 'number') throw invalid();
      return { keyId: k.keyId, keyPair: keyPair(k.keyPair) };
    }),
  };
}

/**
 * Encrypt a snapshot under the passphrase. Returns the JSON envelope string
 * (what gets written to the downloaded file).
 */
export async function encryptRecoveryPackage(
  userId: string,
  snapshot: E2eeStoreSnapshot,
  passphrase: string,
): Promise<string> {
  const s = await getSodium();
  if (!passphrase || passphrase.length < 8) {
    throw new Error('Passphrase must be at least 8 characters');
  }

  const pkg = serializeSnapshot(userId, snapshot);
  const salt = s.randombytes_buf(16);
  const iter = RECOVERY_PBKDF2_ITERATIONS;
  const key = await deriveKey(passphrase, salt, iter);
  const nonce = s.randombytes_buf(s.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const plaintext = utf8Bytes(JSON.stringify(pkg));
  const ciphertext = s.crypto_aead_xchacha20poly1305_ietf_encrypt(
    plaintext,
    null,
    null,
    nonce,
    key,
  );

  const envelope: RecoveryEnvelope = {
    v: RECOVERY_ENVELOPE_VERSION,
    alg: RECOVERY_ENVELOPE_ALG,
    iter,
    salt: b64(s, salt),
    nonce: b64(s, nonce),
    ciphertext: b64(s, ciphertext),
  };
  return JSON.stringify(envelope);
}

/**
 * Decrypt an envelope. Wrong passphrase and tampered ciphertext both surface
 * as the same message — an attacker must not learn which one was wrong.
 */
export async function decryptRecoveryPackage(
  envelopeJson: string,
  passphrase: string,
): Promise<DecryptedRecoveryPackage> {
  const s = await getSodium();
  const invalid = () => new Error('Incorrect passphrase or corrupted backup');

  let envelope: RecoveryEnvelope;
  try {
    envelope = JSON.parse(envelopeJson) as RecoveryEnvelope;
  } catch {
    throw new Error('Recovery file is not a valid Zynkra backup');
  }
  if (
    !envelope ||
    envelope.v !== RECOVERY_ENVELOPE_VERSION ||
    envelope.alg !== RECOVERY_ENVELOPE_ALG ||
    typeof envelope.iter !== 'number' ||
    envelope.iter < MIN_ITERATIONS ||
    envelope.iter > MAX_ITERATIONS
  ) {
    throw new Error('Recovery file is not a valid Zynkra backup');
  }

  let key: Uint8Array;
  let nonce: Uint8Array;
  let salt: Uint8Array;
  let ciphertext: Uint8Array;
  try {
    salt = norm(s.from_base64(envelope.salt));
    nonce = norm(s.from_base64(envelope.nonce));
    ciphertext = norm(s.from_base64(envelope.ciphertext));
  } catch {
    throw new Error('Recovery file is not a valid Zynkra backup');
  }
  if (nonce.length !== s.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES) {
    throw new Error('Recovery file is not a valid Zynkra backup');
  }

  try {
    key = await deriveKey(passphrase, salt, envelope.iter);
    const plaintext = s.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      ciphertext,
      null,
      nonce,
      key,
    );
    const pkg = JSON.parse(s.to_string(plaintext)) as SerializedRecoveryPackage;
    const snapshot = deserializeSnapshot(pkg);
    return { userId: pkg.userId, exportedAt: pkg.exportedAt, snapshot };
  } catch (err) {
    if (err instanceof Error && err.message === 'Backup is missing the identity key') {
      throw err;
    }
    if (err instanceof Error && err.message === 'Recovery file is not a valid Zynkra backup') {
      throw err;
    }
    throw invalid();
  }
}
