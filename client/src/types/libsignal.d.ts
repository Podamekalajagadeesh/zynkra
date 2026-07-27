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

  export interface PreKeyBundleType {
    registrationId: number;
    deviceId: number;
    identityKey: ArrayBuffer;
    signedPreKeyId: number;
    signedPreKey: ArrayBuffer;
    signedPreKeySignature: ArrayBuffer;
    preKeyId?: number;
    preKey?: ArrayBuffer;
  }

  // --- Storage Interface ---
  export interface SignalProtocolStore {
    getIdentityKeyPair(): Promise<KeyPairType | null>;
    getLocalRegistrationId(): Promise<number>;
    isTrustedIdentity(
      identifier: string,
      identityKey: ArrayBuffer,
      direction: number,
    ): Promise<boolean>;
    saveIdentity(identifier: string, identityKey: ArrayBuffer): Promise<boolean>;
    loadPreKey(keyId: number): Promise<KeyPairType | null>;
    storePreKey(keyId: number, keyPair: KeyPairType): Promise<void>;
    removePreKey(keyId: number): Promise<void>;
    loadSignedPreKey(keyId: number): Promise<KeyPairType | null>;
    storeSignedPreKey(keyId: number, keyPair: KeyPairType): Promise<void>;
    loadSession(identifier: string): Promise<string | null>;
    storeSession(identifier: string, record: string): Promise<void>;
    removeSession(identifier: string): Promise<void>;
    removeAllSessions(identifier: string): Promise<void>;
  }

  // --- Session Builder ---
  export class SessionBuilder {
    constructor(store: SignalProtocolStore, address: SignalProtocolAddress);
    processPreKeyBundle(preKeyBundle: PreKeyBundleType): Promise<void>;
  }

  // --- Session Cipher ---
  export interface CiphertextMessageType {
    type: number;
    body: string;
    serialized: string;
  }

  export class SessionCipher {
    constructor(store: SignalProtocolStore, address: SignalProtocolAddress);
    encrypt(message: ArrayBuffer): Promise<CiphertextMessageType>;
    decryptPreKeyWhisperMessage(
      ciphertext: ArrayBuffer,
      encoding: string,
    ): Promise<ArrayBuffer>;
    decryptWhisperMessage(
      ciphertext: ArrayBuffer,
      encoding: string,
    ): Promise<ArrayBuffer>;
  }

  // --- Crypto Functions ---
  export function generateIdentityKeyPair(): Promise<KeyPairType>;
  export function generatePreKey(keyId: number): Promise<PreKeyPairType>;
  export function generateSignedPreKey(
    identityKeyPair: KeyPairType,
    keyId: number,
  ): Promise<SignedPreKeyPairType>;
  export function createPreKeyBundle(
    store: SignalProtocolStore,
    identityKeyPair: KeyPairType,
    signedPreKey: SignedPreKeyPairType,
    preKeys: PreKeyPairType | null,
  ): Promise<PreKeyBundleType>;

  // --- Curve ---
  export function generateKeyPair(): Promise<KeyPairType>;
  export function createKeyPair(privKey: ArrayBuffer): Promise<KeyPairType>;
}
