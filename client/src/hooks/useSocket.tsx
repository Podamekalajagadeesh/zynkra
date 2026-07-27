// @ts-nocheck
import { useEffect, useState, useContext, createContext, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './useUser';
import { API_BASE_URL } from '../lib/api';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      // useUser returns the active account; the profile lives on .user
      const userId = user.user.id;
      const newSocket = io(API_BASE_URL, {
        query: { userId },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        // Announce presence so the activity gateway can track online status.
        newSocket.emit('user-online', { userId });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const contextValue = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};
