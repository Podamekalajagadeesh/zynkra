import { useState, useEffect, useRef } from 'react';
import { spatialAudioService, SpatialAudioState } from '../services/spatialAudio';

export const useSpatialAudio = () => {
  const [state, setState] = useState<SpatialAudioState>(spatialAudioService.getState());
  const stateRef = useRef<SpatialAudioState>(state);

  useEffect(() => {
    const unsubscribe = spatialAudioService.subscribe((newState) => {
      stateRef.current = newState;
      setState(newState);
    });

    return () => unsubscribe();
  }, []);

  return {
    state,
    isEnabled: state.isEnabled,
    listenerPosition: state.listenerPosition,
    enabledParticipants: state.enabledParticipants,
    setEnabled: spatialAudioService.setEnabled.bind(spatialAudioService),
    updateListenerPosition: spatialAudioService.updateListenerPosition.bind(spatialAudioService),
    setParticipantPosition: spatialAudioService.setParticipantPosition.bind(spatialAudioService),
    getAllParticipantPositions: spatialAudioService.getAllParticipantPositions.bind(spatialAudioService),
    animateParticipantToPosition: spatialAudioService.animateParticipantToPosition.bind(spatialAudioService),
    arrangeParticipantsInCircle: spatialAudioService.arrangeParticipantsInCircle.bind(spatialAudioService),
    arrangeParticipantsInTheater: spatialAudioService.arrangeParticipantsInTheater.bind(spatialAudioService),
  };
};