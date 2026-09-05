import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { Switch } from '../ui/switch';
import { useNotifications } from '../../providers/notifications-provider';

type NotificationPreferenceKey =
  | 'emailDigest'
  | 'pushAlerts'
  | 'securityAlerts'
  | 'notifyNewFollower'
  | 'notifyMentions'
  | 'notifyMessages'
  | 'notifyComments'
  | 'notifyLikes';

type NotificationPreferences = Record<NotificationPreferenceKey, boolean> & {
  smsAlerts?: boolean;
  customNotifications: Record<string, boolean>;
  updatedAt: string;
};

const defaultPreferences: NotificationPreferences = {
  emailDigest: true,
  pushAlerts: true,
  securityAlerts: true,
  notifyNewFollower: true,
  notifyMentions: true,
  notifyMessages: true,
  notifyComments: true,
  notifyLikes: true,
  customNotifications: {},
  updatedAt: '',
};

const preferenceRows: Array<{ key: NotificationPreferenceKey; label: string }> = [
  { key: 'emailDigest', label: 'Email notifications' },
  { key: 'pushAlerts', label: 'Browser and mobile push alerts' },
  { key: 'securityAlerts', label: 'Security alerts' },
  { key: 'notifyNewFollower', label: 'New followers' },
  { key: 'notifyMentions', label: 'Mentions' },
  { key: 'notifyMessages', label: 'Direct messages' },
  { key: 'notifyComments', label: 'Comments and replies' },
  { key: 'notifyLikes', label: 'Likes' },
];

export const NotificationSettings = () => {
  const { activeAccount, setUser } = useAuth();
  const { pushSupported } = useNotifications();
  const user = activeAccount?.user;
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<NotificationPreferenceKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoading(true);
    api.get<NotificationPreferences>('/account/notifications/preferences')
      .then(({ data }) => {
        if (!cancelled) setPreferences({ ...defaultPreferences, ...data });
      })
      .catch(() => {
        if (!cancelled) setError('Could not load notification settings.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  const updateUserSettings = (next: NotificationPreferences) => {
    if (!user) return;
    setUser({
      ...user,
      notificationSettings: {
        ...user.notificationSettings,
        emailNotifications: next.emailDigest,
        likes: next.notifyLikes,
        comments: next.notifyComments,
        newFollowers: next.notifyNewFollower,
        messages: next.notifyMessages,
        emailDigest: next.emailDigest,
        pushAlerts: next.pushAlerts,
        securityAlerts: next.securityAlerts,
        notifyMentions: next.notifyMentions,
        customNotifications: next.customNotifications,
      },
    });
  };

  const handleSettingChange = async (key: NotificationPreferenceKey, value: boolean) => {
    const previous = preferences;
    setPreferences({ ...preferences, [key]: value });
    setSaving(key);
    setError(null);

    try {
      const response = await api.put<NotificationPreferences>('/account/notifications/preferences', { [key]: value });
      const saved = { ...defaultPreferences, ...response.data };
      setPreferences(saved);
      updateUserSettings(saved);
    } catch {
      setPreferences(previous);
      setError('Could not save notification settings.');
    } finally {
      setSaving(null);
    }
  };

  const enableBrowserPush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

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
    if (!preferences.pushAlerts) await handleSettingChange('pushAlerts', true);
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Notification Settings</h3>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {pushSupported && (
        <div className="flex items-center justify-between rounded border border-gray-200 p-3">
          <div>
            <p className="font-medium">Browser push</p>
            <p className="text-sm text-gray-500">Allow push delivery for enabled alerts.</p>
          </div>
          <button type="button" onClick={enableBrowserPush} disabled={loading} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
            Enable
          </button>
        </div>
      )}
      {loading ? <p className="text-sm text-gray-500">Loading notification settings...</p> : preferenceRows.map(({ key, label }) => (
        <div className="flex items-center justify-between" key={key}>
          <label htmlFor={`notification-${key}`}>{label}</label>
          <Switch id={`notification-${key}`} checked={preferences[key]} disabled={saving === key} onCheckedChange={(value) => handleSettingChange(key, value)} />
        </div>
      ))}
    </div>
  );
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const rawData = window.atob((base64String + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
};
