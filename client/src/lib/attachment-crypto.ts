/**
 * Per-attachment encryption for E2EE DM media.
 *
 * Follows the Signal attachment model: the file bytes are encrypted
 * client-side with a random symmetric key (XChaCha20-Poly1305), the
 * ciphertext is uploaded to the media store, and the key + nonce travel
 * only inside the Signal-encrypted message envelope. The server stores
 * ciphertext and metadata it cannot read.
 */
import libsodium from 'libsodium-wrappers';

let sodium: typeof libsodium | null = null;

async function getSodium() {
  if (!sodium) {
    await libsodium.ready;
    sodium = libsodium;
  }
  return sodium;
}

export const E2EE_ATTACHMENT_ALG = 'xchacha20poly1305';

export interface EncryptedAttachment {
  /** Ciphertext blob to upload (opaque bytes). */
  blob: Blob;
  /** Base64 symmetric key — deliver ONLY inside the E2EE envelope. */
  key: string;
  /** Base64 nonce used for this attachment. */
  nonce: string;
  /** Algorithm tag stored alongside the media URL on the server. */
  alg: typeof E2EE_ATTACHMENT_ALG;
}

export interface AttachmentKeyMaterial {
  key: string;
  nonce: string;
}

/** Read blob bytes — jsdom's Blob lacks arrayBuffer(), so fall back to FileReader. */
async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }
  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Copy into a fresh ArrayBuffer-backed view — BlobPart rejects
 * Uint8Array<ArrayBufferLike> (may be backed by a SharedArrayBuffer).
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.length);
  new Uint8Array(copy).set(bytes);
  return copy;
}

/** Encrypt a file's bytes. The returned blob is opaque ciphertext. */
export async function encryptAttachment(file: File | Blob): Promise<EncryptedAttachment> {
  const s = await getSodium();
  const plaintext = await blobToBytes(file);
  const key = s.randombytes_buf(s.crypto_aead_xchacha20poly1305_ietf_KEYBYTES);
  const nonce = s.randombytes_buf(s.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const ciphertext = s.crypto_aead_xchacha20poly1305_ietf_encrypt(
    plaintext,
    null,
    null,
    nonce,
    key
  );
  return {
    blob: new Blob([toArrayBuffer(ciphertext)], { type: 'application/octet-stream' }),
    key: s.to_base64(key),
    nonce: s.to_base64(nonce),
    alg: E2EE_ATTACHMENT_ALG,
  };
}

/** Decrypt ciphertext previously produced by encryptAttachment. */
export async function decryptAttachment(
  ciphertext: Blob,
  keyMaterial: AttachmentKeyMaterial
): Promise<Blob> {
  const s = await getSodium();
  const key = s.from_base64(keyMaterial.key);
  const nonce = s.from_base64(keyMaterial.nonce);
  if (key.length !== s.crypto_aead_xchacha20poly1305_ietf_KEYBYTES) {
    throw new Error('Invalid attachment key length');
  }
  if (nonce.length !== s.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES) {
    throw new Error('Invalid attachment nonce length');
  }
  const bytes = await blobToBytes(ciphertext);
  const plaintext = s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, bytes, null, nonce, key);
  return new Blob([toArrayBuffer(plaintext)]);
}

/**
 * The plaintext carried inside the Signal envelope for a message that has
 * encrypted attachments. Plain text messages keep sending the raw string —
 * this shape is only used when attachments are present, and recipients
 * fall back to treating non-JSON plaintext as plain text.
 */
export interface E2eeMessagePayload {
  v: 1;
  text?: string;
  attachments?: { url: string; type: 'image' | 'video' | 'audio'; key: string; nonce: string }[];
}

export function isE2eeMessagePayload(value: unknown): value is E2eeMessagePayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as E2eeMessagePayload).v === 1 &&
    Array.isArray((value as E2eeMessagePayload).attachments)
  );
}
