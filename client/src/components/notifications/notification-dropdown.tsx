import { useNotifications } from '../../providers/notifications-provider';
import { NotificationItem } from './notification-item';
import { Link } from 'react-router-dom';

export const NotificationDropdown = ({ isOpen }) => {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-bold">Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-sm text-blue-500 hover:underline">
            Mark all as read
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="p-4 text-gray-500">No notifications yet.</p>
        ) : (
          notifications.map(notification => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        )}
      </div>
      <div className="p-2 text-center border-t border-gray-200 dark:border-gray-700">
        <Link to="/notifications" className="text-sm text-blue-500 hover:underline">
          View all notifications
        </Link>
      </div>
    </div>
  );
};