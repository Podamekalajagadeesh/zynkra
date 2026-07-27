/**
 * useE2EE — React hook wrapping the E2EE service.
 *
 * Provides encrypt/decrypt functions for use in DM components,
 * with automatic key initialization on mount.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { getE2EEService } from '../services/e2ee.service';

interface UseE2EEReturn {
  isReady: boolean;
  isInitializing: boolean;
  error: string | null;
  encryptMessage: (recipientId: string, plaintext: string) => Promise<string>;
  decryptMessage: (senderId: string, ciphertextJson: string) => Promise<string>;
  establishSession: (userId: string) => Promise<void>;
  hasSession: (userId: string) => Promise<boolean>;
  getIdentityKey: () => Promise<string | null>;
  initializeE2EE: () => Promise<void>;
}

export function useE2EE(userId: string | null | undefined): UseE2EEReturn {
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const initializeE2EE = useCallback(async () => {
    if (!userId || initializedRef.current) return;

    setIsInitializing(true);
    setError(null);

    try {
      const service = getE2EEService();
      await service.initialize(userId);
      initializedRef.current = true;
      setIsReady(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'E2EE initialization failed';
      setError(msg);
      console.warn('E2EE init failed (non-fatal):', msg);
      // Don't block messaging — fall back gracefully
    } finally {
      setIsInitializing(false);
    }
  }, [userId]);

  useEffect(() => {
    initializeE2EE();
  }, [initializeE2EE]);

  const encryptMessage = useCallback(
    async (recipientId: string, plaintext: string): Promise<string> => {
      const service = getE2EEService();

      // Try to establish session first if not ready
      if (!initializedRef.current) {
        await initializeE2EE();
      }

      return service.encryptMessage(recipientId, plaintext);
    },
    [initializeE2EE],
  );

  const decryptMessage = useCallback(
    async (senderId: string, ciphertextJson: string): Promise<string> => {
      const service = getE2EEService();

      if (!initializedRef.current) {
        await initializeE2EE();
      }

      return service.decryptMessage(senderId, ciphertextJson);
    },
    [initializeE2EE],
  );

  const establishSession = useCallback(
    async (recipientId: string): Promise<void> => {
      const service = getE2EEService();

      if (!initializedRef.current) {
        await initializeE2EE();
      }

      await service.establishSession(recipientId);
    },
    [initializeE2EE],
  );

  const hasSession = useCallback(
    async (userIdToCheck: string): Promise<boolean> => {
      const service = getE2EEService();
      return service.hasSession(userIdToCheck);
    },
    [],
  );

  const getIdentityKey = useCallback(async (): Promise<string | null> => {
    const service = getE2EEService();
    return service.getIdentityKeyB64();
  }, []);

  return {
    isReady,
    isInitializing,
    error,
    encryptMessage,
    decryptMessage,
    establishSession,
    hasSession,
    getIdentityKey,
    initializeE2EE,
  };
}
