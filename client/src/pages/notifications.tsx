import { useNotifications } from '../providers/notifications-provider';
import { NotificationItem } from '../components/notifications/notification-item';
import { PageShell } from '../components/PageShell';

const NotificationsPage = () => {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  return (
    <PageShell
      eyebrow="Stay updated"
      title="Your Notifications"
      description={`You have ${unreadCount} unread notifications.`}
    >
      <div className="max-w-3xl mx-auto">
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