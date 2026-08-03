import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../lib/api';

export interface TrendItem {
  tag: string;
  score: number;
  occurrenceCount: number;
}

export function useLiveTrending(enabled = true) {
  const [trending, setTrending] = useState<TrendItem[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const socket = io(`${API_BASE_URL.replace(/\/+$/, '')}/trends`, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    socket.on('trends:updated', (list: TrendItem[]) => setTrending(list));
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  return { trending };
}
