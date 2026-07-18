/// <reference types="vite/client" />
import { Eip1193Provider } from 'ethers';

declare module '@privacyresearch/libsignal-protocol-typescript' {
  export class SignalProtocolAddress {
    constructor(name: string, deviceId: number);
  }

  export class SessionBuilder {
    constructor(store: SignalProtocolStore, address: SignalProtocolAddress);
    processPreKey(bundle: PreKeyBundle): Promise<void>;
  }

  export class SessionCipher {
    constructor(store: SignalProtocolStore, address: SignalProtocolAddress);
    encrypt(message: Buffer): Promise<unknown>;
    decryptPreKeyWhisperMessage(message: unknown, encoding: string): Promise<ArrayBuffer>;
    decryptWhisperMessage(message: unknown, encoding: string): Promise<ArrayBuffer>;
  }

  export interface SignalProtocolStore {
    getLocalRegistrationId(): Promise<number | null>;
    put(key: string, value: unknown): Promise<void>;
    storePreKey(keyId: string | number, keyPair: unknown): void;
    storeSignedPreKey(keyId: string | number, keyPair: unknown): void;
  }

  export interface PreKeyBundle {
    registrationId?: number;
    deviceId?: number;
    preKey?: unknown;
    signedPreKey?: unknown;
    identityKey?: unknown;
    [key: string]: unknown;
  }

  export interface SignedPreKeyType {
    keyId: number;
    keyPair: unknown;
    signature?: Uint8Array;
  }

  export interface KeyPairType {
    privateKey?: unknown;
    publicKey?: unknown;
  }
}

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_API_URL?: string;
}
interface Window {
  ethereum?: Eip1193Provider;
}