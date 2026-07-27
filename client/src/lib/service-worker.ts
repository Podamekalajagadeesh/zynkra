// @ts-nocheck
/**
 * Service Worker for Zynkra Offline-First Architecture.
 *
 * Responsibilities:
 * 1. Cache static assets for offline access
 * 2. Intercept API requests and cache responses
 * 3. Background sync when connection returns
 * 4. Push notifications
 */

const CACHE_NAME = 'zynkra-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/main.js',
  '/assets/main.css',
  '/offline.html',
];

const API_CACHE = 'zynkra-api-v1';
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== API_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/dms/') || url.pathname.startsWith('/posts/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful GET responses
          if (event.request.method === 'GET' && response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: serve from cache
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            // Return a basic offline response
            return new Response(JSON.stringify({
              error: 'offline',
              message: 'You are offline. Changes will sync when connection returns.',
            }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
            });
          });
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Background Sync — trigger sync when connection returns
self.addEventListener('sync', (event) => {
  if (event.tag === 'zynkra-sync') {
    event.waitUntil(syncPendingChanges());
  }
});

async function syncPendingChanges() {
  // Open IndexedDB and get pending items
  const db = await openDB();
  const tx = db.transaction('syncQueue', 'readonly');
  const store = tx.objectStore('syncQueue');
  const items = await getAllFromStore(store);

  const pending = items.filter(item => item.status === 'pending');

  for (const item of pending) {
    try {
      await fetch(item.endpoint, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });

      // Mark as completed
      const writeTx = db.transaction('syncQueue', 'readwrite');
      const writeStore = writeTx.objectStore('syncQueue');
      item.status = 'completed';
      await putInStore(writeStore, item);
    } catch (err) {
      // Will retry on next sync
      const writeTx = db.transaction('syncQueue', 'readwrite');
      const writeStore = writeTx.objectStore('syncQueue');
      item.retries = (item.retries || 0) + 1;
      item.status = item.retries >= 5 ? 'failed' : 'pending';
      await putInStore(writeStore, item);
    }
  }

  // Notify client that sync completed
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE', timestamp: new Date().toISOString() });
  });
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('zynkra-offline', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store: IDBObjectStore): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function putInStore(store: IDBObjectStore, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Zynkra';
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.url || '/',
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data)
  );
});
