import { useNotifications } from '../../providers/notifications-provider';
import type { NotificationItem as NotificationData } from '../../providers/notifications-provider';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDateTime } from '../../lib/preferences';

const getNotificationLink = (notification: NotificationData) => {
  const senderUsername = notification?.sender?.username;

  switch (notification?.type) {
    case 'like':
    case 'comment':
      return notification?.post?.id ? `/post/${notification.post.id}` : '#';
    case 'follow':
      return senderUsername ? `/profile/${senderUsername}` : '#';
    case 'login_alert':
      return '/security-checkup';
    default:
      return '#';
  }
};

const getNotificationText = (notification: NotificationData) => {
  switch (notification?.type) {
    case 'like':
      return <>liked your post</>;
    case 'comment':
      return <>commented on your post</>;
    case 'follow':
      return <>started following you</>;
    case 'login_alert': {
      const metadata = notification.metadata;
      const deviceName =
        typeof metadata?.deviceName === 'string' && metadata.deviceName
          ? metadata.deviceName
          : 'a new device';
      const ipAddress =
        typeof metadata?.ipAddress === 'string' && metadata.ipAddress
          ? metadata.ipAddress
          : '';
      return (
        <>
          signed in from {deviceName}
          {ipAddress ? ` (${ipAddress})` : ''}
        </>
      );
    }
    default:
      return 'sent you a notification';
  }
};

export const NotificationItem = ({ notification }: { notification: NotificationData }) => {
  const { markAsRead } = useNotifications();
  const sender = notification?.sender ?? { username: 'System', profile: null };
  const senderUsername = sender.username || 'System';

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
            <AvatarImage src={sender.profile?.avatarUrl || undefined} alt={senderUsername} />
            <AvatarFallback>{senderUsername.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p>
              <span className="font-bold">{senderUsername}</span> {getNotificationText(notification)}
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