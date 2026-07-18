import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { Switch } from '../ui/switch';
import { useNotifications } from '../../providers/notifications-provider';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export const NotificationSettings = () => {
  const { activeAccount, setUser } = useAuth();
  const { pushSupported } = useNotifications();
  const user = activeAccount?.user;

  const handleSettingChange = async (key: string, value: boolean) => {
    if (!user) {
      return;
    }

    const newSettings = {
      ...user.notificationSettings,
      [key]: value,
    };

    try {
      const updatedUser = await api.patch('/users/me/notification-settings', newSettings);
      setUser(updatedUser.data);
    } catch (error) {
      console.error('Failed to update notification settings', error);
    }
  };

  if (!user) {
    return null;
  }

  const enableBrowserPush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BKEjbr36R5cSGwT5Af7cgPUPXuaoBGC2KFjAZmehBh9h6ToZ1Cnb9gyptSsVyLb71Qg4_rHVF1J_4L6Okgrialo';
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    await api.post('/notifications/push/subscribe', {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.toJSON().keys?.p256dh || '',
        auth: subscription.toJSON().keys?.auth || '',
      },
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Notification Settings</h3>
      {pushSupported && (
        <div className="flex items-center justify-between rounded border border-gray-200 p-3">
          <div>
            <p className="font-medium">Browser push</p>
            <p className="text-sm text-gray-500">Receive notifications even when the app is closed.</p>
          </div>
          <button
            type="button"
            onClick={enableBrowserPush}
            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white"
          >
            Enable
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <label htmlFor="email-notification">Email notifications</label>
        <Switch
          id="email-notification"
          checked={user.notificationSettings?.emailNotifications ?? true}
          onCheckedChange={(value) => handleSettingChange('emailNotifications', value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <label htmlFor="likes-notification">Likes</label>
        <Switch
          id="likes-notification"
          checked={user.notificationSettings?.likes ?? true}
          onCheckedChange={(value) => handleSettingChange('likes', value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <label htmlFor="comments-notification">Comments</label>
        <Switch
          id="comments-notification"
          checked={user.notificationSettings?.comments ?? true}
          onCheckedChange={(value) => handleSettingChange('comments', value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <label htmlFor="new-followers-notification">New Followers</label>
        <Switch
          id="new-followers-notification"
          checked={user.notificationSettings?.newFollowers ?? true}
          onCheckedChange={(value) => handleSettingChange('newFollowers', value)}
        />
      </div>
    </div>
  );
};