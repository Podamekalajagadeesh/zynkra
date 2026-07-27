// @ts-nocheck
/**
 * Register the service worker for offline support.
 * Call this once when the app initializes.
 */
export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('Service worker registered:', registration.scope);

    // Listen for sync messages from the service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        console.log('Background sync completed:', event.data.timestamp);
        // Dispatch a custom event that the app can listen to
        window.dispatchEvent(new CustomEvent('offline-sync-complete', {
          detail: { timestamp: event.data.timestamp },
        }));
      }
    });

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Every hour
  } catch (error) {
    console.error('Service worker registration failed:', error);
  }
}

/**
 * Request permission for push notifications.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Check if we're currently offline.
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Check if we're in a service worker context.
 */
export function isServiceWorkerContext(): boolean {
  return typeof ServiceWorkerGlobalScope !== 'undefined' && self instanceof ServiceWorkerGlobalScope;
}
