import { useState, useEffect } from 'react';
import { 
  fullSensoryMetaverseService, 
  FullSensoryState,
  FullSensoryEnvironmentConfig,
  HapticFeedback,
  OlfactoryStimulus,
  GustatoryStimulus,
  VisualEffect
} from '../services/fullSensoryMetaverse';

export function useFullSensoryMetaverse() {
  const [state, setState] = useState<FullSensoryState>(fullSensoryMetaverseService.getState());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize the service on mount
    const initialize = async () => {
      try {
        await fullSensoryMetaverseService.initialize();
        setIsInitialized(true);
        setState(fullSensoryMetaverseService.getState());
      } catch (error) {
        console.error('Failed to initialize full-sensory metaverse:', error);
      }
    };

    initialize();

    // Subscribe to state changes
    const unsubscribe = fullSensoryMetaverseService.subscribe((newState) => {
      setState(newState);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      fullSensoryMetaverseService.destroy();
    };
  }, []);

  // Load a specific environment
  const loadEnvironment = (environmentId: string) => {
    try {
      fullSensoryMetaverseService.loadEnvironment(environmentId);
    } catch (error) {
      console.error('Failed to load environment:', error);
    }
  };

  // Get all available environments
  const getEnvironments = (): FullSensoryEnvironmentConfig[] => {
    return fullSensoryMetaverseService.getAvailableEnvironments();
  };

  // Add custom stimuli
  const addHaptic = (haptic: HapticFeedback) => fullSensoryMetaverseService.addHapticFeedback(haptic);
  const addScent = (scent: OlfactoryStimulus) => fullSensoryMetaverseService.addOlfactoryStimulus(scent);
  const addTaste = (taste: GustatoryStimulus) => fullSensoryMetaverseService.addGustatoryStimulus(taste);
  const addVisual = (visual: VisualEffect) => fullSensoryMetaverseService.addVisualEffect(visual);

  // Update environment sensory parameters (sensory content editing feature)
  const updateEnvironmentParameters = (
    environmentId: string,
    updates: {
      ambientTemperature?: number;
      scentModifications?: Array<{sourceId: string; newIntensity?: number; newConcentration?: number}>;
      hapticModifications?: Array<{sourceId: string; newValue?: number; newIntensity?: number}>;
      lightIntensity?: number;
    }
  ) => fullSensoryMetaverseService.updateEnvironmentParameters(environmentId, updates);

  return {
    state,
    isInitialized,
    loadEnvironment,
    getEnvironments,
    addHaptic,
    addScent,
    addTaste,
    addVisual,
    updateEnvironmentParameters,
  };
}