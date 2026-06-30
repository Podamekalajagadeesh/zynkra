import { useState, useEffect } from 'react';
import { 
  blendedRealityService, 
  BlendedRealityState,
  BlendedDigitalObject,
  PhysicalEnvironmentScan,
  CollaborativeBlendedSession
} from '../services/blendedReality';

export function useBlendedReality() {
  const [state, setState] = useState<BlendedRealityState>(blendedRealityService.getState());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize the blended reality service on mount
    const initialize = async () => {
      try {
        await blendedRealityService.initialize();
        setIsInitialized(true);
        setState(blendedRealityService.getState());
      } catch (error) {
        console.error('Failed to initialize physical-digital blended reality:', error);
      }
    };

    initialize();

    // Subscribe to state changes
    const unsubscribe = blendedRealityService.subscribe((newState) => {
      setState(newState);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      blendedRealityService.destroy();
    };
  }, []);

  // Start scanning the physical environment
  const startScan = () => {
    try {
      blendedRealityService.startEnvironmentScan();
    } catch (error) {
      console.error('Failed to start environment scan:', error);
    }
  };

  // Stop scanning the physical environment
  const stopScan = () => {
    try {
      blendedRealityService.stopEnvironmentScan();
    } catch (error) {
      console.error('Failed to stop environment scan:', error);
    }
  };

  // Place a new digital object in the physical environment
  const placeDigitalObject = (object: BlendedDigitalObject): string | null => {
    try {
      return blendedRealityService.placeDigitalObject(object);
    } catch (error) {
      console.error('Failed to place digital object:', error);
      return null;
    }
  };

  // Update an existing digital object
  const updateDigitalObject = (objectId: string, updates: Partial<BlendedDigitalObject>) => {
    try {
      blendedRealityService.updateDigitalObject(objectId, updates);
    } catch (error) {
      console.error('Failed to update digital object:', error);
    }
  };

  // Remove a digital object from the environment
  const removeDigitalObject = (objectId: string) => {
    try {
      blendedRealityService.removeDigitalObject(objectId);
    } catch (error) {
      console.error('Failed to remove digital object:', error);
    }
  };

  // Create a new collaborative session
  const createSession = (name: string): string | null => {
    try {
      return blendedRealityService.createCollaborativeSession(name);
    } catch (error) {
      console.error('Failed to create collaborative session:', error);
      return null;
    }
  };

  // Get all active digital objects
  const getActiveDigitalObjects = (): Map<string, BlendedDigitalObject> => {
    return new Map(state.activeDigitalObjects);
  };

  // Get current physical environment scan
  const getCurrentScan = (): PhysicalEnvironmentScan | null => {
    return state.currentPhysicalScan;
  };

  // Get all active collaborative sessions
  const getActiveSessions = (): Map<string, CollaborativeBlendedSession> => {
    return new Map(state.activeCollaborativeSessions);
  };

  // Invite a user to a collaborative session
  const inviteUserToSession = (sessionId: string, userId: string): boolean => {
    try {
      return blendedRealityService.inviteUserToSession(sessionId, userId);
    } catch (error) {
      console.error('Failed to invite user to session:', error);
      return false;
    }
  };

  // Remove a user from a collaborative session
  const removeUserFromSession = (sessionId: string, userId: string): boolean => {
    try {
      return blendedRealityService.removeUserFromSession(sessionId, userId);
    } catch (error) {
      console.error('Failed to remove user from session:', error);
      return false;
    }
  };

  return {
    state,
    isInitialized,
    startScan,
    stopScan,
    placeDigitalObject,
    updateDigitalObject,
    removeDigitalObject,
    createSession,
    getActiveDigitalObjects,
    getCurrentScan,
    getActiveSessions,
    inviteUserToSession,
    removeUserFromSession
  };
}