import { Bell } from 'lucide-react';
import { useNotifications } from '../../providers/notifications-provider';

export const NotificationIcon = ({ onClick }) => {
  const { unreadCount } = useNotifications();

  return (
    <button onClick={onClick} className="relative rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-800">
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
};