import { useCallback, useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import { useUser } from './useUser';

export type NeuralLiveStreamParticipantRole = 'host' | 'co-host' | 'viewer';
export type NeuralLiveStreamSignalType = 'reaction' | 'question' | 'spotlight-request' | 'sensory-feedback';
export type NeuralLiveStreamThoughtType = 'observation' | 'thought' | 'memory' | 'sensory-input';

export interface NeuralLiveStreamParticipant {
  userId: string;
  displayName: string;
  role: NeuralLiveStreamParticipantRole;
  joinedAt: number;
  isSpeaking: boolean;
}

export interface NeuralLiveStreamThought {
  id: string;
  userId: string;
  displayName: string;
  type: NeuralLiveStreamThoughtType;
  content: string;
  intensity: number;
  sensoryTags: string[];
  timestamp: number;
}

export interface NeuralLiveStreamAudienceSignal {
  id: string;
  userId: string;
  displayName: string;
  type: NeuralLiveStreamSignalType;
  content: string;
  reaction?: string;
  timestamp: number;
}

export interface NeuralLiveStreamBroadcast {
  headline: string;
  description: string;
  currentScene: string;
  sensoryPalette: string[];
  thoughtPrompt: string;
  broadcastIntensity: number;
}

export interface NeuralLiveStreamSession {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  participants: NeuralLiveStreamParticipant[];
  broadcast: NeuralLiveStreamBroadcast;
  thoughts: NeuralLiveStreamThought[];
  audienceSignals: NeuralLiveStreamAudienceSignal[];
  createdAt: number;
  updatedAt: number;
  isLive: boolean;
  maxAudience: number;
}

interface CreateNeuralLiveStreamInput {
  title: string;
  headline: string;
  description?: string;
  currentScene?: string;
  sensoryPalette?: string[];
  thoughtPrompt?: string;
  broadcastIntensity?: number;
  maxAudience?: number;
}

export function useNeuralLiveStreaming() {
  const { socket, isConnected } = useSocket();
  const { user } = useUser();

  const [sessions, setSessions] = useState<NeuralLiveStreamSession[]>([]);
  const [currentSession, setCurrentSession] = useState<NeuralLiveStreamSession | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const currentUser = user?.user;

  const upsertSession = useCallback((session: NeuralLiveStreamSession) => {
    setSessions((existingSessions) => {
      const nextSessions = existingSessions.filter((existingSession) => existingSession.id !== session.id);
      nextSessions.unshift(session);
      return nextSessions;
    });
  }, []);

  const removeSession = useCallback((sessionId: string) => {
    setSessions((existingSessions) => existingSessions.filter((session) => session.id !== sessionId));
  }, []);

  const refreshSessions = useCallback(() => {
    if (!socket) {
      setSessionError('Socket connection is unavailable');
      return;
    }

    setIsLoadingSessions(true);
    socket.emit('neural-live-stream:list-sessions', undefined, (response: { success: boolean; sessions?: NeuralLiveStreamSession[]; error?: string }) => {
      if (response.success && response.sessions) {
        setSessions(response.sessions);
        setSessionError(null);
      } else {
        setSessionError(response.error || 'Failed to load neural live stream sessions');
      }
      setIsLoadingSessions(false);
    });
  }, [socket]);

  const createSession = useCallback((input: CreateNeuralLiveStreamInput) => {
    if (!socket || !currentUser) {
      setSessionError('Socket or user is unavailable');
      return;
    }

    setIsSubmitting(true);
    const displayName = currentUser.displayName || currentUser.username || 'You';

    socket.emit(
      'neural-live-stream:create-session',
      {
        hostId: currentUser.id,
        displayName,
        ...input,
      },
      (response: { success: boolean; session?: NeuralLiveStreamSession; error?: string }) => {
        if (response.success && response.session) {
          upsertSession(response.session);
          setCurrentSession(response.session);
          setSessionError(null);
        } else {
          setSessionError(response.error || 'Failed to create a neural live stream session');
        }

        setIsSubmitting(false);
      },
    );
  }, [socket, currentUser, upsertSession]);

  const joinSession = useCallback((sessionId: string, role: NeuralLiveStreamParticipantRole = 'viewer') => {
    if (!socket || !currentUser) {
      setSessionError('Socket or user is unavailable');
      return;
    }

    setIsSubmitting(true);
    const displayName = currentUser.displayName || currentUser.username || 'Guest';

    socket.emit(
      'neural-live-stream:join-session',
      {
        sessionId,
        userId: currentUser.id,
        displayName,
        role,
      },
      (response: { success: boolean; session?: NeuralLiveStreamSession; error?: string }) => {
        if (response.success && response.session) {
          upsertSession(response.session);
          setCurrentSession(response.session);
          setSessionError(null);
        } else {
          setSessionError(response.error || 'Failed to join the neural live stream session');
        }

        setIsSubmitting(false);
      },
    );
  }, [socket, currentUser, upsertSession]);

  const leaveSession = useCallback(() => {
    if (!socket || !currentUser || !currentSession) {
      return;
    }

    socket.emit('neural-live-stream:leave-session', {
      sessionId: currentSession.id,
      userId: currentUser.id,
    });

    setCurrentSession(null);
  }, [socket, currentUser, currentSession]);

  const updateBroadcast = useCallback((sessionId: string, updates: Partial<NeuralLiveStreamBroadcast>) => {
    if (!socket || !currentUser) {
      setSessionError('Socket or user is unavailable');
      return;
    }

    socket.emit('neural-live-stream:update-broadcast', {
      sessionId,
      userId: currentUser.id,
      updates,
    });
  }, [socket, currentUser]);

  const addThought = useCallback((sessionId: string, thought: Omit<NeuralLiveStreamThought, 'id' | 'timestamp'>) => {
    if (!socket || !currentUser) {
      setSessionError('Socket or user is unavailable');
      return;
    }

    socket.emit('neural-live-stream:add-thought', {
      sessionId,
      ...thought,
    });
  }, [socket, currentUser]);

  const addAudienceSignal = useCallback((sessionId: string, signal: Omit<NeuralLiveStreamAudienceSignal, 'id' | 'timestamp'>) => {
    if (!socket || !currentUser) {
      setSessionError('Socket or user is unavailable');
      return;
    }

    socket.emit('neural-live-stream:add-audience-signal', {
      sessionId,
      ...signal,
    });
  }, [socket, currentUser]);

  const endSession = useCallback((sessionId: string) => {
    if (!socket) {
      setSessionError('Socket connection is unavailable');
      return;
    }

    socket.emit('neural-live-stream:end-session', { sessionId });
  }, [socket]);

  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    refreshSessions();

    const handleSessionCreated = (payload: { session: NeuralLiveStreamSession }) => {
      upsertSession(payload.session);
      setCurrentSession(payload.session);
    };

    const handleSessionJoined = (payload: { session: NeuralLiveStreamSession }) => {
      upsertSession(payload.session);
      setCurrentSession(payload.session);
    };

    const handleSessionUpdated = (payload: { session: NeuralLiveStreamSession }) => {
      upsertSession(payload.session);
      setCurrentSession((existingSession) => (existingSession?.id === payload.session.id ? payload.session : existingSession));
    };

    const handleThoughtAdded = (payload: { sessionId: string; thought: NeuralLiveStreamThought }) => {
      setSessions((existingSessions) => existingSessions.map((session) => {
        if (session.id !== payload.sessionId) {
          return session;
        }

        const thoughtExists = session.thoughts.some((existingThought) => existingThought.id === payload.thought.id);
        return {
          ...session,
          thoughts: thoughtExists ? session.thoughts : [...session.thoughts, payload.thought],
          updatedAt: Date.now(),
        };
      }));

      setCurrentSession((existingSession) => {
        if (existingSession?.id !== payload.sessionId) {
          return existingSession;
        }

        const thoughtExists = existingSession.thoughts.some((existingThought) => existingThought.id === payload.thought.id);
        return {
          ...existingSession,
          thoughts: thoughtExists ? existingSession.thoughts : [...existingSession.thoughts, payload.thought],
          updatedAt: Date.now(),
        };
      });
    };

    const handleSignalAdded = (payload: { sessionId: string; signal: NeuralLiveStreamAudienceSignal }) => {
      setSessions((existingSessions) => existingSessions.map((session) => {
        if (session.id !== payload.sessionId) {
          return session;
        }

        const signalExists = session.audienceSignals.some((existingSignal) => existingSignal.id === payload.signal.id);
        return {
          ...session,
          audienceSignals: signalExists ? session.audienceSignals : [...session.audienceSignals, payload.signal],
          updatedAt: Date.now(),
        };
      }));

      setCurrentSession((existingSession) => {
        if (existingSession?.id !== payload.sessionId) {
          return existingSession;
        }

        const signalExists = existingSession.audienceSignals.some((existingSignal) => existingSignal.id === payload.signal.id);
        return {
          ...existingSession,
          audienceSignals: signalExists ? existingSession.audienceSignals : [...existingSession.audienceSignals, payload.signal],
          updatedAt: Date.now(),
        };
      });
    };

    const handleSessionsUpdated = (payload: { sessions: NeuralLiveStreamSession[] }) => {
      setSessions(payload.sessions);
      setCurrentSession((existingSession) => {
        if (!existingSession) {
          return existingSession;
        }

        return payload.sessions.find((session) => session.id === existingSession.id) || existingSession;
      });
    };

    const handleSessionEnded = (payload: { sessionId: string }) => {
      removeSession(payload.sessionId);
      setCurrentSession((existingSession) => (existingSession?.id === payload.sessionId ? null : existingSession));
    };

    socket.on('neural-live-stream:session-created', handleSessionCreated);
    socket.on('neural-live-stream:session-joined', handleSessionJoined);
    socket.on('neural-live-stream:session-updated', handleSessionUpdated);
    socket.on('neural-live-stream:thought-added', handleThoughtAdded);
    socket.on('neural-live-stream:audience-signal-added', handleSignalAdded);
    socket.on('neural-live-stream:sessions-updated', handleSessionsUpdated);
    socket.on('neural-live-stream:session-ended', handleSessionEnded);

    return () => {
      socket.off('neural-live-stream:session-created', handleSessionCreated);
      socket.off('neural-live-stream:session-joined', handleSessionJoined);
      socket.off('neural-live-stream:session-updated', handleSessionUpdated);
      socket.off('neural-live-stream:thought-added', handleThoughtAdded);
      socket.off('neural-live-stream:audience-signal-added', handleSignalAdded);
      socket.off('neural-live-stream:sessions-updated', handleSessionsUpdated);
      socket.off('neural-live-stream:session-ended', handleSessionEnded);
    };
  }, [socket, isConnected, refreshSessions, upsertSession, removeSession]);

  return {
    sessions,
    currentSession,
    isLoadingSessions,
    isSubmitting,
    sessionError,
    refreshSessions,
    createSession,
    joinSession,
    leaveSession,
    updateBroadcast,
    addThought,
    addAudienceSignal,
    endSession,
    isInSession: Boolean(currentSession),
  };
}