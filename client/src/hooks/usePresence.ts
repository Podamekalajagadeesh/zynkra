import { useCallback, useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import { api } from '../lib/api';

export interface PresenceStatus {
  userId: string;
  isOnline?: boolean;
  lastSeenAt?: string | null;
}

/**
 * Presence for a set of user IDs: fetches an initial snapshot over REST and
 * stays current via the activity gateway's `user-status-updated` events.
 */
export function usePresence(userIds: string[]) {
  const { socket } = useSocket();
  const [statuses, setStatuses] = useState<Record<string, PresenceStatus>>({});

  const key = userIds.filter(Boolean).sort().join(',');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    api
      .get(`/activity/status?ids=${key}`)
      .then((res) => {
        if (cancelled) return;
        const next: Record<string, PresenceStatus> = {};
        for (const s of res.data as PresenceStatus[]) next[s.userId] = s;
        setStatuses((prev) => ({ ...prev, ...next }));
      })
      .catch(() => {
        // Presence is best-effort; leave statuses empty on failure.
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!socket) return;
    const handler = (status: PresenceStatus) => {
      setStatuses((prev) =>
        prev[status.userId] || key.includes(status.userId)
          ? { ...prev, [status.userId]: status }
          : prev,
      );
    };
    socket.on('user-status-updated', handler);
    return () => {
      socket.off('user-status-updated', handler);
    };
  }, [socket, key]);

  const isOnline = useCallback(
    (userId: string) => statuses[userId]?.isOnline === true,
    [statuses],
  );

  return { statuses, isOnline };
}
