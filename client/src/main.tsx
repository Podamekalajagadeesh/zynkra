import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationsProvider } from './providers/notifications-provider';
import { PreferencesProvider } from './contexts/PreferencesContext';
import './index.css';
import { WagmiProvider } from 'wagmi';
import { config } from './lib/web3';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { initializeOfflineSync } from './lib/offlineSync';
import { SocketProvider } from './hooks/useSocket';

// Color blindness correction SVG filters
const ColorBlindFilters = () => (
  <svg className="colorblind-filters" aria-hidden="true">
    <defs>
      <filter id="protanopia">
        <feColorMatrix
          type="matrix"
          values="0.567, 0.433, 0, 0, 0
                  0.558, 0.442, 0, 0, 0
                  0, 0.242, 0.758, 0, 0
                  0, 0, 0, 1, 0"
        />
      </filter>
      <filter id="deuteranopia">
        <feColorMatrix
          type="matrix"
          values="0.625, 0.375, 0, 0, 0
                  0.7, 0.3, 0, 0, 0
                  0, 0.3, 0.7, 0, 0
                  0, 0, 0, 1, 0"
        />
      </filter>
      <filter id="tritanopia">
        <feColorMatrix
          type="matrix"
          values="0.95, 0.05, 0, 0, 0
                  0, 0.433, 0.567, 0, 0
                  0, 0.475, 0.525, 0, 0
                  0, 0, 0, 1, 0"
        />
      </filter>
    </defs>
  </svg>
);

async function enableMocking() {
  if (!import.meta.env.DEV) {
    return;
  }

  try {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  } catch (error) {
    console.warn('MSW failed to start:', error);
  }
}

// A stale MSW service worker (registered before MSW was disabled) claims the page
// and intercepts requests, but the client no longer handshakes with it — so API
// calls fail with ERR_NETWORK. Unregister it on startup so it stops controlling the page.
// If it was controlling this page, reload once so the next load runs without it
// (guarded against loops).
async function unregisterStaleMockServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    let removed = false;
    for (const registration of registrations) {
      const scriptUrl = registration.active?.scriptURL ?? registration.installing?.scriptURL ?? '';
      if (scriptUrl.includes('mockServiceWorker.js')) {
        await registration.unregister();
        removed = true;
      }
    }
    if (removed && navigator.serviceWorker.controller && !sessionStorage.getItem('msw-sw-reloaded')) {
      sessionStorage.setItem('msw-sw-reloaded', '1');
      window.location.reload();
    }
  } catch (error) {
    console.warn('Failed to unregister stale MSW service worker:', error);
  }
}

const queryClient = new QueryClient();
const root = ReactDOM.createRoot(document.getElementById('root')!);
initializeOfflineSync();
void unregisterStaleMockServiceWorker();

// MSW is disabled to avoid ERR_NETWORK from stale cached service worker.
// The Vite proxy handles API forwarding in dev mode instead.
// enableMocking();

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <PreferencesProvider>
            <AuthProvider>
              <SocketProvider>
              <NotificationsProvider>
                <ColorBlindFilters />
                <App />
              </NotificationsProvider>
              </SocketProvider>
            </AuthProvider>
          </PreferencesProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

// enableMocking();