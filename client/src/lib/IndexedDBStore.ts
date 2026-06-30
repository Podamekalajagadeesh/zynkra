import { openDB, IDBPDatabase } from 'idb';
import {
  SignalProtocolStore,
  KeyPairType,
  PreKeyType,
  SessionType,
  SignedPreKeyType,
  Direction,
} from '@privacyresearch/libsignal-protocol-typescript';

const DB_NAME = 'signal-protocol-store';
const KEY_VALUE_STORE = 'key-value';

export class IndexedDBStore implements SignalProtocolStore {
  private db: Promise<IDBPDatabase>;

  constructor() {
    this.db = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(KEY_VALUE_STORE);
      },
    });
  }

  async get(key: string, defaultValue: any): Promise<any> {
    const db = await this.db;
    const value = await db.get(KEY_VALUE_STORE, key);
    return value === undefined ? defaultValue : value;
  }

  async put(key: string, value: any): Promise<void> {
    const db = await this.db;
    await db.put(KEY_VALUE_STORE, value, key);
  }

  async remove(key: string): Promise<void> {
    const db = await this.db;
    await db.delete(KEY_VALUE_STORE, key);
  }

  async getIdentityKeyPair(): Promise<KeyPairType | undefined> {
    return this.get('identityKey', undefined);
  }

  async getLocalRegistrationId(): Promise<number | undefined> {
    return this.get('registrationId', undefined);
  }

  async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    _direction: Direction
  ): Promise<boolean> {
    if (identifier === null || identifier === undefined) {
      throw new Error('identifier is null or undefined');
    }
    const trusted = await this.get(`identityKey${identifier}`, undefined);
    if (trusted === undefined) {
      return true;
    }
    return new TextDecoder().decode(identityKey) === new TextDecoder().decode(trusted);
  }

  async loadPreKey(keyId: string | number): Promise<KeyPairType | undefined> {
    return this.get(`preKey${keyId}`, undefined);
  }

  async loadSession(
    identifier: string
  ): Promise<SessionType | undefined> {
    return this.get(`session${identifier}`, undefined);
  }

  async loadSignedPreKey(
    keyId: string | number
  ): Promise<KeyPairType | undefined> {
    return this.get(`signedPreKey${keyId}`, undefined);
  }

  async removePreKey(keyId: number): Promise<void> {
    await this.remove(`preKey${keyId}`);
  }

  async removeSignedPreKey(keyId: number): Promise<void> {
    await this.remove(`signedPreKey${keyId}`);
  }

  async storePreKey(
    keyId: string | number,
    keyPair: KeyPairType
  ): Promise<void> {
    await this.put(`preKey${keyId}`, keyPair);
  }

  async storeSession(
    identifier: string,
    record: SessionType
  ): Promise<void> {
    await this.put(`session${identifier}`, record);
  }

  async storeSignedPreKey(
    keyId: string | number,
    keyPair: KeyPairType
  ): Promise<void> {
    await this.put(`signedPreKey${keyId}`, keyPair);
  }

  async getOurIdentity(): Promise<KeyPairType> {
      const identity = await this.get('identityKey', undefined);
      if (!identity) throw new Error("Identity not found");
      return identity;
  }
}