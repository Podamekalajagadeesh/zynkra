import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useNeuralState, NeuralState } from './useNeuralState';
import { useUser } from './useUser';

export interface SharedAttentionSession {
  id: string;
  hostId: string;
  participants: string[];
  currentContent: {
    type: 'video' | 'stream' | 'post' | 'virtual-event';
    id: string;
    url?: string;
    timestamp: number;
    title: string;
  } | null;
  isActive: boolean;
  createdAt: Date;
  syncedParticipants: string[];
}

export interface ParticipantNeuralState {
  userId: string;
  userName: string;
  avatar: string;
  neuralState: NeuralState;
  isInSync: boolean;
  lastSyncTimestamp: Date;
  syncOffsetMs: number;
}

export interface SharedAttentionEvent {
  type: 'join' | 'leave' | 'content-update' | 'play' | 'pause' | 'seek' | 'sync' | 'disconnect';
  timestamp: Date;
  userId: string;
  payload?: any;
}

export function useSharedAttention() {
  const { socket, isConnected } = useSocket();
  const { neuralState } = useNeuralState();
  const { user } = useUser();
  
  const [currentSession, setCurrentSession] = useState<SharedAttentionSession | null>(null);
  const [participants, setParticipants] = useState<Map<string, ParticipantNeuralState>>(new Map());
  const [eventLog, setEventLog] = useState<SharedAttentionEvent[]>([]);
  const [isSynchronizing, setIsSynchronizing] = useState(false);
  const [syncQuality, setSyncQuality] = useState<number>(100); // 0-100
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  const lastSyncRef = useRef<number>(Date.now());
  const localContentTimestampRef = useRef<number>(0);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create a new shared attention session
  const createSession = useCallback(async (content?: SharedAttentionSession['currentContent']) => {
    if (!socket || !user) {
      setSessionError('Socket or user not available');
      return;
    }

    try {
      setIsSynchronizing(true);
      socket.emit('shared-attention:create-session', { content, hostId: user.id }, (response: any) => {
        if (response.success) {
          setCurrentSession(response.session);
          addEvent({
            type: 'join',
            timestamp: new Date(),
            userId: user.id,
            payload: { sessionId: response.session.id }
          });
        } else {
          setSessionError(response.error || 'Failed to create session');
        }
        setIsSynchronizing(false);
      });
    } catch (error) {
      setSessionError('Failed to create shared attention session');
      setIsSynchronizing(false);
    }
  }, [socket, user]);

  // Join an existing shared attention session
  const joinSession = useCallback(async (sessionId: string) => {
    if (!socket || !user) {
      setSessionError('Socket or user not available');
      return;
    }

    try {
      setIsSynchronizing(true);
      socket.emit('shared-attention:join-session', { sessionId, userId: user.id }, (response: any) => {
        if (response.success) {
          setCurrentSession(response.session);
          // Initialize participants map
          const newParticipants = new Map<string, ParticipantNeuralState>();
          response.session.participants.forEach((participant: any) => {
            newParticipants.set(participant.userId, {
              userId: participant.userId,
              userName: participant.userName,
              avatar: participant.avatar,
              neuralState: participant.neuralState,
              isInSync: true,
              lastSyncTimestamp: new Date(),
              syncOffsetMs: 0
            });
          });
          setParticipants(newParticipants);
          addEvent({
            type: 'join',
            timestamp: new Date(),
            userId: user.id
          });
        } else {
          setSessionError(response.error || 'Failed to join session');
        }
        setIsSynchronizing(false);
      });
    } catch (error) {
      setSessionError('Failed to join shared attention session');
      setIsSynchronizing(false);
    }
  }, [socket, user]);

  // Leave the current session
  const leaveSession = useCallback(async () => {
    if (!socket || !user || !currentSession) return;

    socket.emit('shared-attention:leave-session', { 
      sessionId: currentSession.id, 
      userId: user.id 
    });
    
    setCurrentSession(null);
    setParticipants(new Map());
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    addEvent({
      type: 'leave',
      timestamp: new Date(),
      userId: user.id
    });
  }, [socket, user, currentSession]);

  // Update current content in the session
  const updateContent = useCallback((content: SharedAttentionSession['currentContent']) => {
    if (!socket || !currentSession) return;

    socket.emit('shared-attention:update-content', {
      sessionId: currentSession.id,
      content,
      timestamp: Date.now()
    });

    setCurrentSession(prev => prev ? { ...prev, currentContent: content } : null);
    addEvent({
      type: 'content-update',
      timestamp: new Date(),
      userId: user?.id || '',
      payload: { content }
    });
  }, [socket, currentSession, user]);

  // Play/pause control
  const sendPlaybackCommand = useCallback((command: 'play' | 'pause' | 'seek', timestamp?: number) => {
    if (!socket || !currentSession) return;

    const serverTimestamp = Date.now();
    socket.emit('shared-attention:playback-control', {
      sessionId: currentSession.id,
      command,
      timestamp: timestamp ?? serverTimestamp,
      serverTimestamp
    });

    localContentTimestampRef.current = timestamp ?? serverTimestamp;
    addEvent({
      type: command === 'play' ? 'play' : command === 'pause' ? 'pause' : 'seek',
      timestamp: new Date(),
      userId: user?.id || '',
      payload: { timestamp }
    });
  }, [socket, currentSession, user]);

  // Add event to log
  const addEvent = useCallback((event: SharedAttentionEvent) => {
    setEventLog(prev => [...prev.slice(-99), event]);
  }, []);

  // Calculate sync offset for participants
  const calculateSyncQuality = useCallback(() => {
    if (participants.size === 0) return 100;
    
    let totalOffset = 0;
    participants.forEach(p => {
      totalOffset += p.syncOffsetMs;
    });
    
    const avgOffset = totalOffset / participants.size;
    // Convert average offset (ms) to quality score
    const quality = Math.max(0, Math.min(100, 100 - (avgOffset / 10)));
    setSyncQuality(quality);
    return quality;
  }, [participants]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle new participant joining
    socket.on('shared-attention:participant-joined', (data: { participant: ParticipantNeuralState }) => {
      setParticipants(prev => {
        const newMap = new Map(prev);
        newMap.set(data.participant.userId, data.participant);
        return newMap;
      });
      addEvent({
        type: 'join',
        timestamp: new Date(),
        userId: data.participant.userId
      });
    });

    // Handle participant leaving
    socket.on('shared-attention:participant-left', (data: { userId: string }) => {
      setParticipants(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
      addEvent({
        type: 'leave',
        timestamp: new Date(),
        userId: data.userId
      });
    });

    // Handle content updates from host
    socket.on('shared-attention:content-updated', (data: { content: SharedAttentionSession['currentContent'], serverTimestamp: number }) => {
      setCurrentSession(prev => prev ? { ...prev, currentContent: data.content } : null);
      localContentTimestampRef.current = data.serverTimestamp;
      addEvent({
        type: 'content-update',
        timestamp: new Date(),
        userId: ''
      });
    });

    // Handle playback commands
    socket.on('shared-attention:playback-update', (data: { 
      command: 'play' | 'pause' | 'seek', 
      timestamp: number,
      serverTimestamp: number
    }) => {
      localContentTimestampRef.current = data.timestamp;
      // Update local content player timestamp
      addEvent({
        type: data.command,
        timestamp: new Date(),
        userId: ''
      });
    });

    // Handle sync updates from other participants
    socket.on('shared-attention:participant-sync', (data: { 
      userId: string, 
      neuralState: NeuralState,
      timestamp: number,
      localTimestamp: number
    }) => {
      setParticipants(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(data.userId);
        if (existing) {
          const syncOffset = Math.abs(Date.now() - data.timestamp);
          newMap.set(data.userId, {
            ...existing,
            neuralState: data.neuralState,
            lastSyncTimestamp: new Date(data.timestamp),
            isInSync: syncOffset < 500, // Consider in sync if offset < 500ms
            syncOffsetMs: syncOffset
          });
        }
        return newMap;
      });
    });

    // Handle session ended
    socket.on('shared-attention:session-ended', () => {
      setCurrentSession(null);
      setParticipants(new Map());
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      addEvent({
        type: 'disconnect',
        timestamp: new Date(),
        userId: ''
      });
    });

    return () => {
      socket.off('shared-attention:participant-joined');
      socket.off('shared-attention:participant-left');
      socket.off('shared-attention:content-updated');
      socket.off('shared-attention:playback-update');
      socket.off('shared-attention:participant-sync');
      socket.off('shared-attention:session-ended');
    };
  }, [socket, addEvent]);

  // Send periodic sync updates to server
  useEffect(() => {
    if (!currentSession || !socket || !user) return;

    // Send sync update every 100ms for smooth synchronization
    syncIntervalRef.current = setInterval(() => {
      socket.emit('shared-attention:sync', {
        sessionId: currentSession.id,
        userId: user.id,
        neuralState: neuralState,
        timestamp: Date.now(),
        localContentTimestamp: localContentTimestampRef.current
      });
      lastSyncRef.current = Date.now();
    }, 100);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [currentSession, socket, user, neuralState]);

  // Update sync quality whenever participants change
  useEffect(() => {
    calculateSyncQuality();
  }, [participants, calculateSyncQuality]);

  return {
    currentSession,
    participants: Array.from(participants.values()),
    eventLog,
    isSynchronizing,
    syncQuality,
    sessionError,
    createSession,
    joinSession,
    leaveSession,
    updateContent,
    sendPlaybackCommand,
    isInSession: !!currentSession,
    getLocalContentTimestamp: () => localContentTimestampRef.current
  };
}