import { useCallback, useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import { useUser } from './useUser';

export type CollectiveExperienceTheme = 'virtual-trip' | 'event' | 'story';
export type CollectiveExperienceContributionType = 'travel-note' | 'event-step' | 'story-beat' | 'sensory-cue';

export interface CollectiveExperienceParticipant {
  userId: string;
  displayName: string;
  joinedAt: number;
}

export interface CollectiveExperienceContribution {
  id: string;
  userId: string;
  displayName: string;
  type: CollectiveExperienceContributionType;
  text: string;
  intensity: number;
  timestamp: number;
}

export interface CollectiveExperienceScene {
  prompt: string;
  location: string;
  sensoryMood: string;
  highlights: string[];
}

export interface CollectiveExperienceSession {
  id: string;
  title: string;
  theme: CollectiveExperienceTheme;
  hostId: string;
  hostName: string;
  participants: CollectiveExperienceParticipant[];
  scene: CollectiveExperienceScene;
  contributions: CollectiveExperienceContribution[];
  createdAt: number;
  updatedAt: number;
  isLive: boolean;
}

interface CreateCollectiveExperienceInput {
  title: string;
  theme: CollectiveExperienceTheme;
  prompt: string;
  location?: string;
  sensoryMood?: string;
}

export function useCollectiveExperience() {
  const { socket, isConnected } = useSocket();
  const { user } = useUser();

  const [sessions, setSessions] = useState<CollectiveExperienceSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CollectiveExperienceSession | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const currentUser = user?.user;

  const upsertSession = useCallback((session: CollectiveExperienceSession) => {
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
    socket.emit('collective-experience:list-sessions', undefined, (response: { success: boolean; sessions?: CollectiveExperienceSession[]; error?: string }) => {
      if (response.success && response.sessions) {
        setSessions(response.sessions);
        setSessionError(null);
      } else {
        setSessionError(response.error || 'Failed to load collective experience sessions');
      }
      setIsLoadingSessions(false);
    });
  }, [socket]);

  const createSession = useCallback((input: CreateCollectiveExperienceInput) => {
    if (!socket || !currentUser) {
      setSessionError('Socket or user is unavailable');
      return;
    }

    setIsSubmitting(true);
    const hostName = currentUser.displayName || currentUser.username || 'You';

    socket.emit(
      'collective-experience:create-session',
      {
        hostId: currentUser.id,
        displayName: hostName,
        ...input,
      },
      (response: { success: boolean; session?: CollectiveExperienceSession; error?: string }) => {
        if (response.success && response.session) {
          upsertSession(response.session);
          setCurrentSession(response.session);
          setSessionError(null);
        } else {
          setSessionError(response.error || 'Failed to create a collective experience session');
        }

        setIsSubmitting(false);
      },
    );
  }, [socket, currentUser, upsertSession]);

  const joinSession = useCallback((sessionId: string) => {
    if (!socket || !currentUser) {
      setSessionError('Socket or user is unavailable');
      return;
    }

    setIsSubmitting(true);
    const displayName = currentUser.displayName || currentUser.username || 'Guest';

    socket.emit(
      'collective-experience:join-session',
      {
        sessionId,
        userId: currentUser.id,
        displayName,
      },
      (response: { success: boolean; session?: CollectiveExperienceSession; error?: string }) => {
        if (response.success && response.session) {
          upsertSession(response.session);
          setCurrentSession(response.session);
          setSessionError(null);
        } else {
          setSessionError(response.error || 'Failed to join the collective experience session');
        }

        setIsSubmitting(false);
      },
    );
  }, [socket, currentUser, upsertSession]);

  const leaveSession = useCallback(() => {
    if (!socket || !currentUser || !currentSession) {
      return;
    }

    socket.emit('collective-experience:leave-session', {
      sessionId: currentSession.id,
      userId: currentUser.id,
    });

    setCurrentSession(null);
  }, [socket, currentUser, currentSession]);

  const updateScene = useCallback((sessionId: string, updates: Partial<CollectiveExperienceScene>) => {
    if (!socket || !currentUser) {
      setSessionError('Socket or user is unavailable');
      return;
    }

    socket.emit('collective-experience:update-scene', {
      sessionId,
      userId: currentUser.id,
      updates,
    });
  }, [socket, currentUser]);

  const addContribution = useCallback((sessionId: string, contribution: Omit<CollectiveExperienceContribution, 'id' | 'timestamp'>) => {
    if (!socket || !currentUser) {
      setSessionError('Socket or user is unavailable');
      return;
    }

    socket.emit('collective-experience:add-contribution', {
      sessionId,
      ...contribution,
    });
  }, [socket, currentUser]);

  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    refreshSessions();

    const handleSessionCreated = (payload: { session: CollectiveExperienceSession }) => {
      upsertSession(payload.session);
      setCurrentSession(payload.session);
    };

    const handleSessionJoined = (payload: { session: CollectiveExperienceSession }) => {
      upsertSession(payload.session);
      setCurrentSession(payload.session);
    };

    const handleSessionUpdated = (payload: { session: CollectiveExperienceSession }) => {
      upsertSession(payload.session);
      setCurrentSession((existingSession) => (existingSession?.id === payload.session.id ? payload.session : existingSession));
    };

    const handleContributionAdded = (payload: { sessionId: string; contribution: CollectiveExperienceContribution }) => {
      setSessions((existingSessions) => existingSessions.map((session) => {
        if (session.id !== payload.sessionId) {
          return session;
        }

        const updatedContributions = session.contributions.some((existingContribution) => existingContribution.id === payload.contribution.id)
          ? session.contributions
          : [...session.contributions, payload.contribution];

        return {
          ...session,
          contributions: updatedContributions,
          updatedAt: Date.now(),
        };
      }));

      setCurrentSession((existingSession) => {
        if (existingSession?.id !== payload.sessionId) {
          return existingSession;
        }

        const contributionExists = existingSession.contributions.some((existingContribution) => existingContribution.id === payload.contribution.id);
        return {
          ...existingSession,
          contributions: contributionExists
            ? existingSession.contributions
            : [...existingSession.contributions, payload.contribution],
          updatedAt: Date.now(),
        };
      });
    };

    const handleSessionsUpdated = (payload: { sessions: CollectiveExperienceSession[] }) => {
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

    socket.on('collective-experience:session-created', handleSessionCreated);
    socket.on('collective-experience:session-joined', handleSessionJoined);
    socket.on('collective-experience:session-updated', handleSessionUpdated);
    socket.on('collective-experience:contribution-added', handleContributionAdded);
    socket.on('collective-experience:sessions-updated', handleSessionsUpdated);
    socket.on('collective-experience:session-ended', handleSessionEnded);

    return () => {
      socket.off('collective-experience:session-created', handleSessionCreated);
      socket.off('collective-experience:session-joined', handleSessionJoined);
      socket.off('collective-experience:session-updated', handleSessionUpdated);
      socket.off('collective-experience:contribution-added', handleContributionAdded);
      socket.off('collective-experience:sessions-updated', handleSessionsUpdated);
      socket.off('collective-experience:session-ended', handleSessionEnded);
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
    updateScene,
    addContribution,
    isInSession: Boolean(currentSession),
  };
}