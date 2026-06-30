import { useNotifications } from '../../providers/notifications-provider';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDateTime } from '../../lib/preferences';

const getNotificationLink = (notification) => {
  switch (notification.type) {
    case 'like':
    case 'comment':
      return `/post/${notification.post.id}`;
    case 'follow':
      return `/profile/${notification.sender.username}`;
    case 'login_alert':
      return '/security-checkup';
    default:
      return '#';
  }
};

const getNotificationText = (notification) => {
  switch (notification.type) {
    case 'like':
      return <>liked your post</>;
    case 'comment':
      return <>commented on your post</>;
    case 'follow':
      return <>started following you</>;
    case 'login_alert':
      return (
        <>
          signed in from {notification.metadata?.deviceName || 'a new device'}
          {notification.metadata?.ipAddress ? ` (${notification.metadata.ipAddress})` : ''}
        </>
      );
    default:
      return 'sent you a notification';
  }
};

export const NotificationItem = ({ notification }) => {
  const { markAsRead } = useNotifications();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <Link to={getNotificationLink(notification)} onClick={handleClick}>
      <div className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 ${
        notification.read ? '' : 'bg-blue-50 dark:bg-blue-900/20'
      }`}>
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-4">
            <AvatarImage src={notification.sender.profile?.avatarUrl} alt={notification.sender.username} />
            <AvatarFallback>{notification.sender.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p>
              <span className="font-bold">{notification.sender.username}</span> {getNotificationText(notification)}
            </p>
            <p className="text-xs text-gray-500">
              {formatDateTime(notification.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};