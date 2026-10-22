import { useState, useEffect, useCallback } from 'react';
import { generateKeyPair, initCrypto } from '../lib/crypto';
import { api } from '../lib/api';

const KEY_PAIR_STORAGE_KEY_PREFIX = 'e2ee_key_pair_';

export interface StoredKeyPair {
  publicKey: string;
  privateKey: string;
}

const getStorageKey = (userId: string) => `${KEY_PAIR_STORAGE_KEY_PREFIX}${userId}`;

// localStorage holds untyped JSON — narrow it before trusting the shape.
const isStoredKeyPair = (value: unknown): value is StoredKeyPair =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as StoredKeyPair).publicKey === 'string' &&
  typeof (value as StoredKeyPair).privateKey === 'string';

const getStoredKeyPair = (userId: string): StoredKeyPair | null => {
  if (!userId) return null;
  const raw = localStorage.getItem(getStorageKey(userId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredKeyPair(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const useKeys = (user?: { id?: string } | null) => {
  const [keys, setKeys] = useState<StoredKeyPair | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadKeys = useCallback(async (userId?: string) => {
    if (!userId) {
      setKeys(null);
      setIsInitialized(true);
      return null;
    }

    await initCrypto();
    const keyPair = getStoredKeyPair(userId);
    setKeys(keyPair);
    setIsInitialized(true);
    return keyPair;
  }, []);

  const saveKeys = useCallback(async (userId: string, keyPair: StoredKeyPair) => {
    if (!userId || !keyPair) return;

    localStorage.setItem(getStorageKey(userId), JSON.stringify(keyPair));
    setKeys(keyPair);
    setIsInitialized(true);
  }, []);

  const generateKeys = useCallback(async (userId: string) => {
    if (!userId) return null;

    await initCrypto();
    const keyPair = generateKeyPair();
    localStorage.setItem(getStorageKey(userId), JSON.stringify(keyPair));
    setKeys(keyPair);
    setIsInitialized(true);

    try {
      await api.post('/keys/upload', { publicKey: keyPair.publicKey });
    } catch (error) {
      console.error('Failed to upload public key:', error);
    }

    return keyPair;
  }, []);

  const hasKeys = useCallback((userId: string) => {
    return Boolean(getStoredKeyPair(userId));
  }, []);

  useEffect(() => {
    loadKeys(user?.id);
  }, [user, loadKeys]);

  return {
    keys,
    isInitialized,
    loadKeys,
    saveKeys,
    generateKeys,
    hasKeys,
  };
};
