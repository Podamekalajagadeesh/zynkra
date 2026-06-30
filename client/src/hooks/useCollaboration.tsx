import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useUser } from './useUser';

interface Collaborator {
  userId: string;
  displayName: string;
  lastActive: Date;
}

interface CursorPosition {
  userId: string;
  position: { x: number; y: number };
}

interface SelectionRange {
  userId: string;
  selection: { start: number; end: number };
}

interface UseCollaborationProps {
  postId: string;
  onContentUpdate?: (content: any, userId: string) => void;
  onCollaboratorJoin?: (collaborator: Collaborator) => void;
  onCollaboratorLeave?: (userId: string) => void;
}

export function useCollaboration({ 
  postId, 
  onContentUpdate, 
  onCollaboratorJoin,
  onCollaboratorLeave 
}: UseCollaborationProps) {
  const { socket, isConnected } = useSocket();
  const { user } = useUser();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [selections, setSelections] = useState<Map<string, { start: number; end: number }>>(new Map());
  const lastSentContentRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Join the editing room when socket is connected
  useEffect(() => {
    if (socket && isConnected && user && postId) {
      socket.emit('join-editing-room', {
        postId,
        userId: user.id,
        displayName: user.displayName || user.username
      });

      // Cleanup on unmount
      return () => {
        socket.emit('leave-editing-room', {
          postId,
          userId: user.id
        });
      };
    }
  }, [socket, isConnected, user, postId]);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Receive list of active collaborators
    socket.on('active-collaborators', (activeCollaborators: Collaborator[]) => {
      setCollaborators(activeCollaborators);
    });

    // When a new collaborator joins
    socket.on('collaborator-joined', (data: { userId: string; displayName: string }) => {
      const newCollaborator: Collaborator = {
        userId: data.userId,
        displayName: data.displayName,
        lastActive: new Date()
      };
      setCollaborators(prev => [...prev, newCollaborator]);
      onCollaboratorJoin?.(newCollaborator);
    });

    // When a collaborator leaves
    socket.on('collaborator-left', (data: { userId: string }) => {
      setCollaborators(prev => prev.filter(c => c.userId !== data.userId));
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(data.userId);
        return newCursors;
      });
      setSelections(prev => {
        const newSelections = new Map(prev);
        newSelections.delete(data.userId);
        return newSelections;
      });
      onCollaboratorLeave?.(data.userId);
    });

    // When content is updated by someone else
    socket.on('content-updated', (data: { userId: string; content: any; timestamp: number }) => {
      if (data.userId !== user?.id) {
        onContentUpdate?.(data.content, data.userId);
      }
    });

    // When someone's cursor moves
    socket.on('cursor-moved', (data: { userId: string; position: { x: number; y: number } }) => {
      if (data.userId !== user?.id) {
        setCursors(prev => {
          const newCursors = new Map(prev);
          newCursors.set(data.userId, data.position);
          return newCursors;
        });
      }
    });

    // When someone's text selection changes
    socket.on('selection-changed', (data: { userId: string; selection: any }) => {
      if (data.userId !== user?.id) {
        setSelections(prev => {
          const newSelections = new Map(prev);
          newSelections.set(data.userId, data.selection);
          return newSelections;
        });
      }
    });

    // When access is revoked
    socket.on('access-revoked', (data: { postId: string }) => {
      console.warn('Editing access revoked for post:', data.postId);
    });

    return () => {
      socket.off('active-collaborators');
      socket.off('collaborator-joined');
      socket.off('collaborator-left');
      socket.off('content-updated');
      socket.off('cursor-moved');
      socket.off('selection-changed');
      socket.off('access-revoked');
    };
  }, [socket, user, onContentUpdate, onCollaboratorJoin, onCollaboratorLeave]);

  // Send content updates to the server (debounced)
  const sendContentUpdate = useCallback((content: any) => {
    if (!socket || !user || !postId) return;
    
    // Don't send if content hasn't changed
    if (JSON.stringify(content) === JSON.stringify(lastSentContentRef.current)) return;
    
    lastSentContentRef.current = content;
    
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce to avoid spamming the server
    debounceTimerRef.current = setTimeout(() => {
      socket.emit('content-update', {
        postId,
        userId: user.id,
        content,
        timestamp: Date.now()
      });
    }, 100); // 100ms debounce
  }, [socket, user, postId]);

  // Send cursor position
  const sendCursorPosition = useCallback((position: { x: number; y: number }) => {
    if (!socket || !user || !postId) return;
    socket.emit('cursor-position', {
      postId,
      userId: user.id,
      position
    });
  }, [socket, user, postId]);

  // Send selection changes
  const sendSelectionChange = useCallback((selection: any) => {
    if (!socket || !user || !postId) return;
    socket.emit('selection-change', {
      postId,
      userId: user.id,
      selection
    });
  }, [socket, user, postId]);

  // Invite a new collaborator
  const inviteCollaborator = useCallback((guestId: string, guestEmail: string) => {
    if (!socket || !user || !postId) return;
    socket.emit('invite-collaborator', {
      postId,
      hostId: user.id,
      guestId,
      guestEmail
    });
  }, [socket, user, postId]);

  // Remove an existing collaborator
  const removeCollaborator = useCallback((collaboratorId: string) => {
    if (!socket || !user || !postId) return;
    socket.emit('remove-collaborator', {
      postId,
      hostId: user.id,
      collaboratorId
    });
  }, [socket, user, postId]);

  return {
    collaborators,
    cursors,
    selections,
    isConnected,
    sendContentUpdate,
    sendCursorPosition,
    sendSelectionChange,
    inviteCollaborator,
    removeCollaborator
  };
}