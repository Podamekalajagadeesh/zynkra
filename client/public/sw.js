async function syncPendingOperations() {
  const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientsList) {
    client.postMessage({ type: 'SYNC_PENDING_OPERATIONS' });
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || 'Zynkra';
  const options = {
    body: payload.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'zynkra-offline-sync') {
    event.waitUntil(syncPendingOperations());
  }
});

self.addEventListener('message', (event) => {
  try {
    if (event.data && event.data.type === 'TRIGGER_SYNC') {
      event.waitUntil(syncPendingOperations());
    }

    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  } catch (err) {
    // Ensure the service worker doesn't throw on malformed messages
    console.warn('Service worker message handling error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/notifications') || client.url.includes('/')) {
          client.focus();
          return;
        }
      }

      clients.openWindow('/notifications');
    }),
  );
});
