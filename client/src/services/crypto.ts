import {
  SignalProtocolAddress,
  SessionBuilder,
  SessionCipher,
  SignalProtocolStore,
  PreKeyBundle,
  SignedPreKeyType,
  KeyPairType,
} from '@privacyresearch/libsignal-protocol-typescript';
import { IndexedDBStore } from '../lib/IndexedDBStore';

class CryptoService {
  private store: SignalProtocolStore;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.store = new IndexedDBStore();
  }

  async initialize(): Promise<void> {
    const registrationId = await this.store.getLocalRegistrationId();
    if (!registrationId) {
      const newRegistrationId = this.generateRegistrationId();
      await this.store.put('registrationId', newRegistrationId);

      const identityKeyPair = await this.generateIdentityKeyPair();
      await this.store.put('identityKey', identityKeyPair);

      const preKey = await this.generatePreKey(1);
      this.store.storePreKey(`${preKey.keyId}`, preKey.keyPair);

      const signedPreKey = await this.generateSignedPreKey(identityKeyPair, 1);
      this.store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
    }
  }

  async buildSession(
    recipientId: string,
    bundle: PreKeyBundle
  ): Promise<void> {
    const address = new SignalProtocolAddress(recipientId, 1); // Assuming device ID 1
    const sessionBuilder = new SessionBuilder(this.store, address);
    await sessionBuilder.processPreKey(bundle);
  }

  async encrypt(recipientId: string, message: string): Promise<any> {
    const address = new SignalProtocolAddress(recipientId, 1);
    const cipher = new SessionCipher(this.store, address);
    const ciphertext = await cipher.encrypt(Buffer.from(message));
    return ciphertext;
  }

  async decrypt(
    senderId: string,
    ciphertext: any
  ): Promise<string> {
    const address = new SignalProtocolAddress(senderId, 1);
    const cipher = new SessionCipher(this.store, address);

    let plaintext: ArrayBuffer;
    if (ciphertext.type === 3) { // PreKeyWhisperMessage
      plaintext = await cipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary');
    } else { // WhisperMessage
      plaintext = await cipher.decryptWhisperMessage(ciphertext.body, 'binary');
    }
    return Buffer.from(plaintext).toString();
  }

  private generateRegistrationId(): number {
    return Math.floor(Math.random() * 16383) + 1;
  }

  private async generateIdentityKeyPair(): Promise<KeyPairType> {
    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey']
    );
    return keyPair as any;
  }

  private async generatePreKey(keyId: number): Promise<{ keyId: number; keyPair: KeyPairType }> {
    const keyPair = await window.crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey']
    );
    return { keyId, keyPair: keyPair as any };
  }

  private async generateSignedPreKey(identityKeyPair: KeyPairType, keyId: number): Promise<SignedPreKeyType> {
      const keyPair = await window.crypto.subtle.generateKey(
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveKey']
      );
      const signature = await window.crypto.subtle.sign(
          { name: 'ECDSA', hash: { name: 'SHA-256' } },
          (identityKeyPair as any).privateKey,
          (keyPair as any).publicKey
      );

      return {
          keyId,
          keyPair: keyPair as any,
          signature: new Uint8Array(signature),
      };
  }
}

export default CryptoService;