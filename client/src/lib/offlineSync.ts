type QueuedOperationMethod = 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type QueuedOperationStatus = 'queued' | 'synced' | 'conflict' | 'failed';

export type QueuedOperation = {
  id: string;
  type: 'create-post';
  url: string;
  method: QueuedOperationMethod;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
  createdAt: string;
  attempts: number;
  status: QueuedOperationStatus;
  lastError?: string;
};

const DB_NAME = 'zynkra-offline-sync';
const STORE_NAME = 'operations';
const SYNC_TAG = 'zynkra-offline-sync';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const REGISTRATION_RETRY_KEY = 'zynkra-sw-sync-retry';

function openQueueDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open offline sync database'));
  });
}

async function getQueueStore(): Promise<IDBObjectStore> {
  const db = await openQueueDatabase();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  return transaction.objectStore(STORE_NAME);
}

export async function enqueueOfflineOperation(operation: Omit<QueuedOperation, 'id' | 'createdAt' | 'attempts' | 'status'>): Promise<QueuedOperation> {
  const queuedOperation: QueuedOperation = {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
    status: 'queued',
    ...operation,
  };

  const store = await getQueueStore();
  await new Promise<void>((resolve, reject) => {
    const request = store.put(queuedOperation);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to queue offline operation'));
  });

  return queuedOperation;
}

export async function getPendingOfflineOperations(): Promise<QueuedOperation[]> {
  const db = await openQueueDatabase();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const records = (request.result as QueuedOperation[] | undefined) || [];
      resolve(records.filter((operation) => operation.status !== 'synced'));
    };
    request.onerror = () => reject(request.error || new Error('Failed to read pending operations'));
  });
}

export async function clearOfflineOperation(operationId: string): Promise<void> {
  const store = await getQueueStore();
  await new Promise<void>((resolve, reject) => {
    const request = store.delete(operationId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to clear queued operation'));
  });
}

async function updateOfflineOperation(operationId: string, updates: Partial<QueuedOperation>): Promise<void> {
  const db = await openQueueDatabase();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const existing = await new Promise<QueuedOperation | undefined>((resolve, reject) => {
    const request = store.get(operationId);
    request.onsuccess = () => resolve(request.result as QueuedOperation | undefined);
    request.onerror = () => reject(request.error || new Error('Failed to load queued operation'));
  });

  if (!existing) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const request = store.put({ ...existing, ...updates });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to update queued operation'));
  });
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return {};
  }

  return { Authorization: `Bearer ${token}` };
}

async function uploadQueuedMedia(media: Array<{ fileName: string; mimeType: string; dataUrl: string; altText?: string }>) {
  const uploadedMedia: Array<{ url: string; type: string; altText?: string }> = [];

  for (const item of media) {
    const formData = new FormData();
    const blobResponse = await fetch(item.dataUrl);
    const blob = await blobResponse.blob();
    formData.append('file', new File([blob], item.fileName, { type: item.mimeType }));

    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Media upload failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    uploadedMedia.push({
      url: data.url,
      type: item.mimeType.startsWith('video') ? 'video' : item.mimeType.startsWith('audio') ? 'audio' : 'image',
      altText: item.altText,
    });
  }

  return uploadedMedia;
}

async function executeQueuedOperation(operation: QueuedOperation): Promise<void> {
  if (operation.type === 'create-post') {
    const payload = operation.body as {
      content: string;
      media?: Array<{ fileName: string; mimeType: string; dataUrl: string; altText?: string }>;
      visibility?: string;
      filter?: string;
      tokenGated?: boolean;
      subscriptionGated?: boolean;
      contractAddress?: string;
      requiredTokenBalance?: string;
      taggedUsers?: string[];
      autoTags?: unknown;
      isSensitive?: boolean;
      enableScreenshotProtection?: boolean;
      poll?: unknown;
      locationName?: string;
      latitude?: number;
      longitude?: number;
      stickers?: unknown;
      productTags?: unknown;
      eventTags?: unknown;
      musicTags?: unknown;
      showLikes?: boolean;
      activity?: string;
      reelEffectId?: string;
    };

    const media = payload.media?.length ? await uploadQueuedMedia(payload.media) : [];
    const response = await fetch(`${API_BASE_URL}${operation.url}`, {
      method: operation.method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...(operation.headers || {}),
      },
      body: JSON.stringify({
        ...payload,
        media,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`Sync failed: ${response.status} ${text}`) as Error & { statusCode?: number };
      error.statusCode = response.status;
      throw error;
    }

    return;
  }

  throw new Error(`Unsupported queued operation type: ${operation.type}`);
}

export async function syncPendingOfflineOperations(): Promise<number> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return 0;
  }

  const pendingOperations = await getPendingOfflineOperations();
  if (!pendingOperations.length) {
    return 0;
  }

  const maxAttempts = 5;
  let syncedCount = 0;

  for (const operation of pendingOperations) {
    try {
      await executeQueuedOperation(operation);
      await clearOfflineOperation(operation.id);
      syncedCount += 1;
    } catch (error) {
      const statusCode = (error as Error & { statusCode?: number }).statusCode;
      const message = error instanceof Error ? error.message : 'Unknown sync error';

      if (statusCode === 409) {
        await updateOfflineOperation(operation.id, {
          status: 'conflict',
          lastError: message,
        });
        continue;
      }

      const nextAttempts = operation.attempts + 1;
      if (nextAttempts >= maxAttempts) {
        await updateOfflineOperation(operation.id, {
          attempts: nextAttempts,
          status: 'failed',
          lastError: message,
        });
      } else {
        await updateOfflineOperation(operation.id, {
          attempts: nextAttempts,
          status: 'queued',
          lastError: message,
        });
      }
    }
  }

  return syncedCount;
}

async function attemptBackgroundSyncRegistration(registration?: ServiceWorkerRegistration): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const readyRegistration = registration ?? await navigator.serviceWorker.ready;

    if ('sync' in readyRegistration) {
      try {
        await (readyRegistration as ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }).sync?.register(SYNC_TAG);
        localStorage.removeItem(REGISTRATION_RETRY_KEY);
        return;
      } catch (err) {
        console.warn('Background sync registration failed (sync.register):', err);
      }
    }

    const controller = navigator.serviceWorker.controller;
    if (controller) {
      try {
        controller.postMessage({ type: 'TRIGGER_SYNC' });
      } catch (err) {
        console.warn('PostMessage fallback to trigger sync failed:', err);
      }
    }

    try {
      const raw = localStorage.getItem(REGISTRATION_RETRY_KEY);
      let state = raw ? JSON.parse(raw) as { attempts: number; nextAt: number } : { attempts: 0, nextAt: 0 };
      const now = Date.now();
      if (now < state.nextAt) return;

      state.attempts = (state.attempts || 0) + 1;
      const backoff = Math.min(60 * 60 * 1000, Math.pow(2, state.attempts) * 1000);
      state.nextAt = now + backoff;
      localStorage.setItem(REGISTRATION_RETRY_KEY, JSON.stringify(state));
    } catch (err) {
      // ignore storage errors
    }
  } catch (err) {
    console.warn('Service worker ready check failed when attempting background sync registration:', err);
  }
}

export async function registerServiceWorkerAndSync(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      void attemptBackgroundSyncRegistration();
    });
    await attemptBackgroundSyncRegistration(registration);
    return registration;
  } catch (err) {
    console.warn('Service worker registration failed', err);
    return null;
  }
}

export function initializeOfflineSync(): () => void {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return () => undefined;
  }

  const handleOnline = () => {
    void syncPendingOfflineOperations();
  };

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'SYNC_PENDING_OPERATIONS') {
      void syncPendingOfflineOperations();
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void syncPendingOfflineOperations();
      // Also attempt to (re)register background sync when the user returns.
      void attemptBackgroundSyncRegistration();
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('message', handleMessage);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  if (navigator.onLine) {
    void syncPendingOfflineOperations();
  }

  void registerServiceWorkerAndSync();

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('message', handleMessage);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

export async function getOfflineSyncStatus(): Promise<{ pendingCount: number; conflictedCount: number }> {
  const pending = await getPendingOfflineOperations();
  return {
    pendingCount: pending.filter((operation) => operation.status === 'queued' || operation.status === 'failed').length,
    conflictedCount: pending.filter((operation) => operation.status === 'conflict').length,
  };
}
