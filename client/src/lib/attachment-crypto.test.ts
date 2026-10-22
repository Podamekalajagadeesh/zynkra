import { describe, it, expect } from 'vitest';
import {
  encryptAttachment,
  decryptAttachment,
  isE2eeMessagePayload,
  E2EE_ATTACHMENT_ALG,
} from './attachment-crypto';

async function blobBytes(blob: Blob): Promise<number[]> {
  if (typeof blob.arrayBuffer === 'function') {
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsArrayBuffer(blob);
  });
}

describe('attachment-crypto', () => {
  it('round-trips an attachment through encrypt + decrypt', async () => {
    const original = new File([new Uint8Array([1, 2, 3, 4, 5, 250, 251, 252])], 'voice.webm', {
      type: 'audio/webm',
    });

    const encrypted = await encryptAttachment(original);
    expect(encrypted.alg).toBe(E2EE_ATTACHMENT_ALG);
    expect(encrypted.key).toBeTruthy();
    expect(encrypted.nonce).toBeTruthy();

    const decrypted = await decryptAttachment(encrypted.blob, {
      key: encrypted.key,
      nonce: encrypted.nonce,
    });

    const bytes = await blobBytes(decrypted);
    expect(bytes).toEqual([1, 2, 3, 4, 5, 250, 251, 252]);
  });

  it('produces ciphertext that differs from the plaintext', async () => {
    const original = new Blob([new TextEncoder().encode('secret voice note contents')]);
    const encrypted = await encryptAttachment(original);

    const cipherBytes = new Uint8Array(await blobBytes(encrypted.blob));
    const plainBytes = new Uint8Array(await blobBytes(original));

    expect(cipherBytes.length).toBeGreaterThan(plainBytes.length); // AEAD tag adds 16 bytes
    const cipherAsText = new TextDecoder('latin1').decode(cipherBytes);
    expect(cipherAsText).not.toContain('secret voice note');
  });

  it('rejects a wrong key', async () => {
    const original = new Blob([new Uint8Array([9, 9, 9])]);
    const encrypted = await encryptAttachment(original);
    const other = await encryptAttachment(original);

    await expect(
      decryptAttachment(encrypted.blob, { key: other.key, nonce: encrypted.nonce })
    ).rejects.toThrow();
  });

  it('rejects malformed key material', async () => {
    const original = new Blob([new Uint8Array([1])]);
    const encrypted = await encryptAttachment(original);

    await expect(
      decryptAttachment(encrypted.blob, { key: 'not-base64-key!!!', nonce: encrypted.nonce })
    ).rejects.toThrow();
  });

  it('identifies structured E2EE payloads and rejects other shapes', () => {
    expect(isE2eeMessagePayload({ v: 1, text: 'hi', attachments: [] })).toBe(true);
    expect(
      isE2eeMessagePayload({
        v: 1,
        attachments: [{ url: '/u', type: 'image', key: 'k', nonce: 'n' }],
      })
    ).toBe(true);
    expect(isE2eeMessagePayload('plain text')).toBe(false);
    expect(isE2eeMessagePayload({ v: 2, attachments: [] })).toBe(false);
    expect(isE2eeMessagePayload({ v: 1 })).toBe(false);
    expect(isE2eeMessagePayload(null)).toBe(false);
  });
});
