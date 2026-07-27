/**
 * useOfflineSync — React hook for offline-first data synchronization.
 *
 * Monitors network status, manages the sync queue, and automatically
 * syncs pending changes when the connection returns.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDB } from '../lib/offline-db';
import { api } from '../lib/api';

interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncedAt: string | null;
  error: string | null;
}

interface UseOfflineSyncReturn extends OfflineSyncState {
  /** Queue a change for sync when online */
  queueChange: (change: {
    type: 'post' | 'message' | 'reaction' | 'follow' | 'profile';
    action: 'create' | 'update' | 'delete';
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
  }) => Promise<void>;
  /** Force a sync now (even if offline — will queue) */
  forceSync: () => Promise<void>;
  /** Get offline stats */
  getStats: () => Promise<any>;
  /** Clear all offline data */
  clearOfflineData: () => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingChanges: 0,
    lastSyncedAt: null,
    error: null,
  });
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      syncPendingChanges();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync count
    updatePendingCount();

    // Periodic sync check (every 30 seconds when online)
    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        syncPendingChanges();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const pending = await offlineDB.getPendingSyncItems();
      const lastSynced = await offlineDB.getMetadata('lastSyncedAt');
      setState(prev => ({
        ...prev,
        pendingChanges: pending.length,
        lastSyncedAt: lastSynced,
      }));
    } catch (err) {
      console.warn('Failed to count pending items:', err);
    }
  };

  const syncPendingChanges = async () => {
    if (!navigator.onLine) return;

    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const pendingItems = await offlineDB.getPendingSyncItems();

      for (const item of pendingItems) {
        try {
          item.status = 'syncing';
          await offlineDB.updateSyncItem(item);

          await api.request({
            method: item.method,
            url: item.endpoint,
            data: item.body,
          });

          item.status = 'completed';
          await offlineDB.updateSyncItem(item);
        } catch (err) {
          item.retries += 1;
          if (item.retries >= 5) {
            item.status = 'failed';
          } else {
            item.status = 'pending'; // retry next time
          }
          await offlineDB.updateSyncItem(item);
        }
      }

      await offlineDB.setMetadata('lastSyncedAt', new Date().toISOString());
      await offlineDB.clearCompletedSyncItems();
      await updatePendingCount();

      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Sync failed',
      }));
    }
  };

  const queueChange = useCallback(async (change: {
    type: 'post' | 'message' | 'reaction' | 'follow' | 'profile';
    action: 'create' | 'update' | 'delete';
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
  }) => {
    await offlineDB.addToSyncQueue(change);
    await updatePendingCount();

    // Try immediate sync if online
    if (navigator.onLine) {
      await syncPendingChanges();
    }
  }, []);

  const forceSync = useCallback(async () => {
    await syncPendingChanges();
  }, []);

  const getStats = useCallback(async () => {
    return offlineDB.getOfflineStats();
  }, []);

  const clearOfflineData = useCallback(async () => {
    await offlineDB.clearAll();
    await updatePendingCount();
  }, []);

  return {
    ...state,
    queueChange,
    forceSync,
    getStats,
    clearOfflineData,
  };
}
