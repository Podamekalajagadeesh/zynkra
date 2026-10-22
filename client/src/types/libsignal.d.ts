/**
 * Extended type declarations for @privacyresearch/libsignal-protocol-typescript.
 * Based on the Signal Protocol TypeScript port's full API surface.
 */

declare module '@privacyresearch/libsignal-protocol-typescript' {
  // --- Address ---
  export class SignalProtocolAddress {
    constructor(name: string, deviceId: number);
    getName(): string;
    getDeviceId(): number;
    toString(): string;
    static fromString(encoded: string): SignalProtocolAddress;
  }

  // --- Key Types ---
  export interface KeyPairType {
    privKey: ArrayBuffer;
    pubKey: ArrayBuffer;
  }

  export interface PreKeyPairType {
    keyId: number;
    keyPair: KeyPairType;
  }

  export interface SignedPreKeyPairType {
    keyId: number;
    keyPair: KeyPairType;
    signature: ArrayBuffer;
  }

  // --- Storage Interface ---
  export interface SignalProtocolStore {
    getIdentityKeyPair(): Promise<KeyPairType | undefined>;
    getLocalRegistrationId(): Promise<number>;
    isTrustedIdentity(
      identifier: string,
      identityKey: ArrayBuffer,
      direction: number,
    ): Promise<boolean>;
    saveIdentity(identifier: string, identityKey: ArrayBuffer): Promise<boolean>;
    loadPreKey(keyId: number): Promise<KeyPairType | undefined>;
    storePreKey(keyId: number, keyPair: KeyPairType): Promise<void>;
    removePreKey(keyId: number): Promise<void>;
    loadSignedPreKey(keyId: number): Promise<KeyPairType | undefined>;
    storeSignedPreKey(keyId: number, keyPair: KeyPairType): Promise<void>;
    loadSession(identifier: string): Promise<string | undefined>;
    storeSession(identifier: string, record: string): Promise<void>;
    removeSession(identifier: string): Promise<void>;
    removeAllSessions(identifier: string): Promise<void>;
  }

  // --- Session Builder ---
  // Real 0.0.16 API: DeviceType-shaped bundle via processPreKey().
  export interface PreKeyBundleType {
    registrationId?: number;
    identityKey: ArrayBuffer;
    signedPreKey: {
      keyId: number;
      publicKey: ArrayBuffer;
      signature: ArrayBuffer;
    };
    preKey?: { keyId: number; publicKey: ArrayBuffer };
  }

  export class SessionBuilder {
    constructor(store: SignalProtocolStore, address: SignalProtocolAddress);
    processPreKey(bundle: PreKeyBundleType): Promise<void>;
  }

  // --- Session Cipher ---
  export interface CiphertextMessageType {
    type: number;
    body: string;
    registrationId?: number;
  }

  export class SessionCipher {
    constructor(store: SignalProtocolStore, address: SignalProtocolAddress);
    encrypt(message: ArrayBuffer): Promise<CiphertextMessageType>;
    decryptPreKeyWhisperMessage(
      ciphertext: ArrayBuffer | string,
      encoding?: string,
    ): Promise<ArrayBuffer>;
    decryptWhisperMessage(
      ciphertext: ArrayBuffer | string,
      encoding?: string,
    ): Promise<ArrayBuffer>;
  }

  // --- Key generation (0.0.16: static KeyHelper class) ---
  export class KeyHelper {
    static generateIdentityKeyPair(): Promise<KeyPairType>;
    static generateRegistrationId(): number;
    static generateSignedPreKey(
      identityKeyPair: KeyPairType,
      signedKeyId: number,
    ): Promise<SignedPreKeyPairType>;
    static generatePreKey(keyId: number): Promise<PreKeyPairType>;
  }
}
