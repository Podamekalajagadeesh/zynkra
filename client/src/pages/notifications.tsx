import { useEffect, useState } from 'react';
import { useNotifications } from '../providers/notifications-provider';
import { NotificationItem } from '../components/notifications/notification-item';
import { PageShell } from '../components/PageShell';
import { getAiNotificationDigest, getAiPrioritizedNotifications } from '../lib/api';

type PriorityBucket = {
  critical: Array<Record<string, unknown>>;
  high: Array<Record<string, unknown>>;
  medium: Array<Record<string, unknown>>;
  low: Array<Record<string, unknown>>;
  muted: Array<Record<string, unknown>>;
};

const PRIORITY_GROUPS: Array<{ key: keyof PriorityBucket; label: string; color: string }> = [
  { key: 'critical', label: 'Critical', color: 'text-red-600 dark:text-red-400' },
  { key: 'high', label: 'High priority', color: 'text-orange-600 dark:text-orange-400' },
  { key: 'medium', label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' },
  { key: 'low', label: 'Low', color: 'text-gray-500' },
  { key: 'muted', label: 'Muted', color: 'text-gray-400' },
];

const NotificationsPage = () => {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [showSmart, setShowSmart] = useState(false);
  const [digest, setDigest] = useState<Awaited<ReturnType<typeof getAiNotificationDigest>> | null>(null);
  const [prioritized, setPrioritized] = useState<PriorityBucket | null>(null);

  useEffect(() => {
    if (!notifications.length) return;
    let cancelled = false;
    Promise.all([getAiNotificationDigest(), getAiPrioritizedNotifications()])
      .then(([digestResult, prioritizedResult]) => {
        if (cancelled) return;
        setDigest(digestResult);
        setPrioritized(prioritizedResult);
      })
      .catch((error) => console.error('Failed to load AI notification summary', error));
    return () => {
      cancelled = true;
    };
  }, [notifications.length]);

  return (
    <PageShell
      eyebrow="Stay updated"
      title="Your Notifications"
      description={`You have ${unreadCount} unread notifications.`}
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {notifications.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <button
              type="button"
              onClick={() => setShowSmart((value) => !value)}
              className="w-full p-4 flex justify-between items-center text-left"
            >
              <div>
                <h3 className="font-bold">AI Smart Summary</h3>
                <p className="text-sm text-gray-500">Prioritized digest of your notifications</p>
              </div>
              <span className="text-sm text-blue-500">{showSmart ? 'Hide' : 'Show'}</span>
            </button>

            {showSmart && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                {digest ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-sm">{digest.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {digest.criticalCount > 0 && (
                        <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                          {digest.criticalCount} critical
                        </span>
                      )}
                      {digest.unreadCount > 0 && (
                        <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {digest.unreadCount} unread
                        </span>
                      )}
                      {digest.topCategories.map((category) => (
                        <span
                          key={category}
                          className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Loading smart summary…</p>
                )}

                {prioritized && (
                  <div className="space-y-4">
                    {PRIORITY_GROUPS.map((group) => {
                      const items = prioritized[group.key];
                      if (!items.length) return null;
                      return (
                        <div key={group.key}>
                          <h4 className={`text-xs font-bold uppercase tracking-wide mb-1 ${group.color}`}>
                            {group.label} ({items.length})
                          </h4>
                          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {items.map((item) => (
                              <div key={String(item.id)}>
                                <NotificationItem notification={item} />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold">All Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-blue-500 hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <div>
            {notifications.length === 0 ? (
              <p className="p-4 text-gray-500">You have no notifications.</p>
            ) : (
              notifications.map(notification => (
                <NotificationItem key={notification.id} notification={notification} />
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default NotificationsPage;