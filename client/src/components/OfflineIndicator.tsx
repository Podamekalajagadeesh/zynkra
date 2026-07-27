import { useState, useEffect } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { Wifi, WifiOff, RefreshCw, Check, AlertTriangle, X } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingChanges, lastSyncedAt, forceSync } = useOfflineSync();
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Reset dismissed when going offline
    if (!isOnline) setDismissed(false);
  }, [isOnline]);

  if (dismissed && isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main indicator */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${
          isOnline
            ? isSyncing
              ? 'bg-blue-500 text-white animate-pulse'
              : pendingChanges > 0
                ? 'bg-amber-500 text-white'
                : 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}
      >
        {isOnline ? (
          isSyncing ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : pendingChanges > 0 ? (
            <AlertTriangle size={16} />
          ) : (
            <Wifi size={16} />
          )
        ) : (
          <WifiOff size={16} />
        )}

        <span className="text-sm font-medium">
          {isOnline
            ? isSyncing
              ? 'Syncing...'
              : pendingChanges > 0
                ? `${pendingChanges} pending`
                : 'Online'
            : 'Offline'
          }
        </span>

        {isOnline && !isSyncing && pendingChanges === 0 && (
          <Check size={14} />
        )}
      </button>

      {/* Expanded details */}
      {showDetails && (
        <div className="absolute bottom-12 right-0 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Offline Status</h3>
            <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Pending changes</span>
              <span className={pendingChanges > 0 ? 'text-amber-600' : 'text-gray-700'}>
                {pendingChanges}
              </span>
            </div>

            {lastSyncedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Last synced</span>
                <span className="text-gray-700">
                  {new Date(lastSyncedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {isOnline && pendingChanges > 0 && (
              <button
                onClick={forceSync}
                disabled={isSyncing}
                className="flex-1 px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-sm rounded-lg"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
