import { useState, useEffect, useCallback } from 'react';

export interface NeuralState {
  // Emotional states
  emotions: {
    happiness: number;      // 0-100
    sadness: number;        // 0-100
    excitement: number;     // 0-100
    calmness: number;       // 0-100
    anxiety: number;        // 0-100
    anger: number;          // 0-100
    surprise: number;       // 0-100
    empathy: number;        // 0-100
  };
  // Focus states
  focus: {
    attention: number;      // 0-100 - current attention level
    engagement: number;     // 0-100 - how engaged user is with content
    cognitive_load: number; // 0-100 - mental workload
    mindfulness: number;    // 0-100 - present moment awareness
  };
  // Physical sensations
  physical: {
    heart_rate: number;     // BPM
    breathing_rate: number; // breaths per minute
    muscle_tension: number; // 0-100
    energy_level: number;   // 0-100
    posture: 'sitting' | 'standing' | 'walking' | 'lying';
  };
  // Metadata
  timestamp: Date;
  isTracking: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface NeuralStateUpdate {
  emotions?: Partial<NeuralState['emotions']>;
  focus?: Partial<NeuralState['focus']>;
  physical?: Partial<NeuralState['physical']>;
}

const defaultNeuralState: NeuralState = {
  emotions: {
    happiness: 70,
    sadness: 5,
    excitement: 45,
    calmness: 80,
    anxiety: 15,
    anger: 5,
    surprise: 10,
    empathy: 65,
  },
  focus: {
    attention: 85,
    engagement: 75,
    cognitive_load: 40,
    mindfulness: 70,
  },
  physical: {
    heart_rate: 72,
    breathing_rate: 14,
    muscle_tension: 25,
    energy_level: 65,
    posture: 'sitting',
  },
  timestamp: new Date(),
  isTracking: true,
  connectionQuality: 'excellent',
};

// Simulate real-time neural data fluctuations
const simulateNeuralFluctuations = (state: NeuralState): NeuralState => {
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  
  const randomChange = () => (Math.random() - 0.5) * 10;
  
  return {
    ...state,
    emotions: {
      happiness: clamp(state.emotions.happiness + randomChange(), 0, 100),
      sadness: clamp(state.emotions.sadness + randomChange(), 0, 100),
      excitement: clamp(state.emotions.excitement + randomChange(), 0, 100),
      calmness: clamp(state.emotions.calmness + randomChange(), 0, 100),
      anxiety: clamp(state.emotions.anxiety + randomChange(), 0, 100),
      anger: clamp(state.emotions.anger + randomChange(), 0, 100),
      surprise: clamp(state.emotions.surprise + randomChange(), 0, 100),
      empathy: clamp(state.emotions.empathy + randomChange(), 0, 100),
    },
    focus: {
      attention: clamp(state.focus.attention + randomChange(), 0, 100),
      engagement: clamp(state.focus.engagement + randomChange(), 0, 100),
      cognitive_load: clamp(state.focus.cognitive_load + randomChange(), 0, 100),
      mindfulness: clamp(state.focus.mindfulness + randomChange(), 0, 100),
    },
    physical: {
      ...state.physical,
      heart_rate: clamp(state.physical.heart_rate + (Math.random() - 0.5) * 5, 40, 180),
      breathing_rate: clamp(state.physical.breathing_rate + (Math.random() - 0.5) * 2, 8, 30),
      muscle_tension: clamp(state.physical.muscle_tension + randomChange(), 0, 100),
      energy_level: clamp(state.physical.energy_level + randomChange() * 0.5, 0, 100),
    },
    timestamp: new Date(),
  };
};

export function useNeuralState() {
  const [neuralState, setNeuralState] = useState<NeuralState>(defaultNeuralState);
  const [isTracking, setIsTracking] = useState(true);

  // Update neural state in real-time (simulated)
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setNeuralState(prev => simulateNeuralFluctuations(prev));
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isTracking]);

  const updateNeuralState = useCallback((updates: NeuralStateUpdate) => {
    setNeuralState(prev => ({
      ...prev,
      emotions: { ...prev.emotions, ...updates.emotions },
      focus: { ...prev.focus, ...updates.focus },
      physical: { ...prev.physical, ...updates.physical },
      timestamp: new Date(),
    }));
  }, []);

  const startTracking = useCallback(() => setIsTracking(true), []);
  const stopTracking = useCallback(() => setIsTracking(false), []);

  const getDominantEmotion = useCallback(() => {
    const emotions = neuralState.emotions;
    const emotionEntries = Object.entries(emotions);
    return emotionEntries.reduce((a, b) => a[1] > b[1] ? a : b);
  }, [neuralState.emotions]);

  const getOverallState = useCallback(() => {
    const avgEmotional = Object.values(neuralState.emotions).reduce((a, b) => a + b, 0) / 8;
    const avgFocus = Object.values(neuralState.focus).reduce((a, b) => a + b, 0) / 4;
    const energyNorm = neuralState.physical.energy_level / 100;
    
    return {
      overallWellness: (avgEmotional + avgFocus + (energyNorm * 100)) / 3,
      isStressed: neuralState.emotions.anxiety > 60 || neuralState.physical.muscle_tension > 70,
      isFocused: neuralState.focus.attention > 70 && neuralState.focus.engagement > 60,
      isEnergetic: neuralState.physical.energy_level > 70,
      isCalm: neuralState.emotions.calmness > 70 && neuralState.emotions.anxiety < 30,
    };
  }, [neuralState]);

  return {
    neuralState,
    updateNeuralState,
    isTracking,
    startTracking,
    stopTracking,
    getDominantEmotion,
    getOverallState,
  };
}

export default useNeuralState;