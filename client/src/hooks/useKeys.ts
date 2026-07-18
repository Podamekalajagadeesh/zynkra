import { useState, useEffect, useCallback } from 'react';
import { generateKeyPair, initCrypto } from '../lib/crypto';
import { api } from '../lib/api';

const KEY_PAIR_STORAGE_KEY_PREFIX = 'e2ee_key_pair_';

const getStorageKey = (userId: string) => `${KEY_PAIR_STORAGE_KEY_PREFIX}${userId}`;

const getStoredKeyPair = (userId: string) => {
  if (!userId) return null;
  const raw = localStorage.getItem(getStorageKey(userId));
  return raw ? JSON.parse(raw) : null;
};

export const useKeys = (user) => {
  const [keys, setKeys] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadKeys = useCallback(async (userId: string) => {
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

  const saveKeys = useCallback(async (userId: string, keyPair) => {
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
