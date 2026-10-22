/**
 * E2EE recovery backup — passphrase envelope + snapshot serialization.
 *
 * The package carries session ratchet records: if these are corrupted or the
 * wrong passphrase decrypts them, restored history is garbage. Tests pin the
 * roundtrip, both failure modes, and structural validation.
 */
import { describe, it, expect } from 'vitest';
import {
  encryptRecoveryPackage,
  decryptRecoveryPackage,
  serializeSnapshot,
  deserializeSnapshot,
  RECOVERY_ENVELOPE_VERSION,
} from './e2ee-recovery';
import type { E2eeStoreSnapshot } from './signal-protocol-store';

function buf(...bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function makeSnapshot(): E2eeStoreSnapshot {
  return {
    identityKeyPair: { privKey: buf(10, 11, 12), pubKey: buf(20, 21) },
    registrationId: 4242,
    peerIdentities: [{ identifier: 'peer-1.1', publicKey: buf(30, 31) }],
    sessions: [
      { identifier: 'peer-1.1', record: '{"version":1,"ratchetState":"ok"}' },
      { identifier: 'peer-2.1', record: '{"version":1,"ratchetState":"also-ok"}' },
    ],
    signedPreKeys: [{ keyId: 1, keyPair: { privKey: buf(40, 41), pubKey: buf(50, 51) } }],
    preKeys: [
      { keyId: 2, keyPair: { privKey: buf(60, 61), pubKey: buf(70, 71) } },
      { keyId: 3, keyPair: { privKey: buf(80), pubKey: buf(90) } },
    ],
  };
}

const PASSPHRASE = 'correct horse battery staple';

describe('serializeSnapshot / deserializeSnapshot', () => {
  it('round-trips every field including binary keys', () => {
    const snap = makeSnapshot();
    const restored = deserializeSnapshot(
      JSON.parse(JSON.stringify(serializeSnapshot('user-1', snap)))
    );

    expect(restored.registrationId).toBe(4242);
    expect(restored.sessions).toEqual(snap.sessions);
    expect(new Uint8Array(restored.identityKeyPair!.privKey)).toEqual(
      new Uint8Array(snap.identityKeyPair!.privKey)
    );
    expect(new Uint8Array(restored.peerIdentities[0].publicKey)).toEqual(
      new Uint8Array(snap.peerIdentities[0].publicKey)
    );
    expect(restored.signedPreKeys[0].keyId).toBe(1);
    expect(new Uint8Array(restored.preKeys[1].keyPair.privKey)).toEqual(new Uint8Array([80]));
  });

  it('refuses to export a snapshot without an identity key', () => {
    const snap = makeSnapshot();
    snap.identityKeyPair = null;
    expect(() => serializeSnapshot('user-1', snap)).toThrow('no E2EE identity key');
  });

  it('rejects a structurally invalid package', () => {
    expect(() => deserializeSnapshot({} as never)).toThrow('not a valid Zynkra backup');
    expect(() =>
      deserializeSnapshot({
        v: RECOVERY_ENVELOPE_VERSION,
        userId: 'user-1',
        exportedAt: 'now',
        snapshot: {
          identityKeyPair: { privKey: '###not-base64###', pubKey: 'AA' },
          registrationId: null,
          peerIdentities: [],
          sessions: [],
          signedPreKeys: [],
          preKeys: [],
        },
      } as never)
    ).toThrow('not a valid Zynkra backup');
  });

  it('rejects a package missing the identity key with a distinct error', () => {
    expect(() =>
      deserializeSnapshot({
        v: RECOVERY_ENVELOPE_VERSION,
        userId: 'user-1',
        exportedAt: 'now',
        snapshot: {
          identityKeyPair: null,
          registrationId: null,
          peerIdentities: [],
          sessions: [],
          signedPreKeys: [],
          preKeys: [],
        },
      } as never)
    ).toThrow('missing the identity key');
  });
});

describe('encryptRecoveryPackage / decryptRecoveryPackage', () => {
  it('round-trips a snapshot under the passphrase', async () => {
    const snap = makeSnapshot();
    const envelope = await encryptRecoveryPackage('user-1', snap, PASSPHRASE);

    const parsed = JSON.parse(envelope);
    expect(parsed.v).toBe(RECOVERY_ENVELOPE_VERSION);
    expect(parsed.ciphertext).toBeTruthy();

    const pkg = await decryptRecoveryPackage(envelope, PASSPHRASE);
    expect(pkg.userId).toBe('user-1');
    expect(pkg.snapshot.sessions).toEqual(snap.sessions);
    expect(new Uint8Array(pkg.snapshot.identityKeyPair!.pubKey)).toEqual(
      new Uint8Array(snap.identityKeyPair!.pubKey)
    );
    expect(pkg.snapshot.registrationId).toBe(4242);
  });

  it('rejects a wrong passphrase', async () => {
    const envelope = await encryptRecoveryPackage('user-1', makeSnapshot(), PASSPHRASE);
    await expect(decryptRecoveryPackage(envelope, 'wrong passphrase!')).rejects.toThrow(
      'Incorrect passphrase or corrupted backup'
    );
  });

  it('rejects tampered ciphertext', async () => {
    const envelope = JSON.parse(await encryptRecoveryPackage('user-1', makeSnapshot(), PASSPHRASE));
    // Flip one character inside base64 — auth tag must catch it.
    envelope.ciphertext =
      envelope.ciphertext[0] === 'A'
        ? `B${envelope.ciphertext.slice(1)}`
        : `A${envelope.ciphertext.slice(1)}`;
    await expect(decryptRecoveryPackage(JSON.stringify(envelope), PASSPHRASE)).rejects.toThrow(
      'Incorrect passphrase or corrupted backup'
    );
  });

  it('rejects non-envelope input as an invalid file', async () => {
    await expect(decryptRecoveryPackage('this is not json', PASSPHRASE)).rejects.toThrow(
      'not a valid Zynkra backup'
    );
    await expect(decryptRecoveryPackage(JSON.stringify({ v: 99 }), PASSPHRASE)).rejects.toThrow(
      'not a valid Zynkra backup'
    );
  });

  it('requires a minimum-length passphrase on export', async () => {
    await expect(encryptRecoveryPackage('user-1', makeSnapshot(), 'short')).rejects.toThrow(
      'at least 8 characters'
    );
  });

  it('produces different ciphertext each time (random salt + nonce)', async () => {
    const a = await encryptRecoveryPackage('user-1', makeSnapshot(), PASSPHRASE);
    const b = await encryptRecoveryPackage('user-1', makeSnapshot(), PASSPHRASE);
    expect(JSON.parse(a).ciphertext).not.toBe(JSON.parse(b).ciphertext);
    expect(JSON.parse(a).salt).not.toBe(JSON.parse(b).salt);
  });
});
