import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import io, { type Socket } from 'socket.io-client';
import { api, API_BASE_URL } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

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

export interface NotificationItem {
  id: string;
  read?: boolean;
  type: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
  sender?: {
    id?: string;
    username?: string;
    profile?: {
      avatarUrl?: string | null;
      [key: string]: unknown;
    } | null;
    [key: string]: unknown;
  } | null;
  post?: {
    id?: string;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  pushSupported: boolean;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }

  return context;
};

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [pushSupported, setPushSupported] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get<NotificationItem[]>('/notifications');
      const fetchedNotifications = response.data;
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter((notification) => !notification.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
    }
  }, []);

  useEffect(() => {
    if (!user || !pushSupported) return;

    const enablePush = async () => {
      try {
        const permission = Notification.permission;
        if (permission !== 'granted') {
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await api.post('/notifications/push/subscribe', {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.toJSON().keys?.p256dh || '',
              auth: subscription.toJSON().keys?.auth || '',
            },
          });
          return;
        }

        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BKEjbr36R5cSGwT5Af7cgPUPXuaoBGC2KFjAZmehBh9h6ToZ1Cnb9gyptSsVyLb71Qg4_rHVF1J_4L6Okgrialo';
        const subscriptionOptions = {
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          userVisibleOnly: true,
        };
        const newSubscription = await registration.pushManager.subscribe(subscriptionOptions);

        await api.post('/notifications/push/subscribe', {
          endpoint: newSubscription.endpoint,
          keys: {
            p256dh: newSubscription.toJSON().keys?.p256dh || '',
            auth: newSubscription.toJSON().keys?.auth || '',
          },
        });
      } catch (error) {
        console.error('Failed to register browser push subscription', error);
      }
    };

    enablePush();
  }, [user, pushSupported]);

  useEffect(() => {
    if (user && !socket) {
      const newSocket = io(`${API_BASE_URL.replace(/\/$/, '')}/notifications`, {
        query: { userId: user.id },
      });

      setSocket(newSocket);

      newSocket.on('new_notification', (notification: NotificationItem) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, socket]);

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read/all');
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    pushSupported,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};