import React from 'react';
import { NeuralState } from '../../hooks/useNeuralState';
import { Brain, Heart, Zap, AlertCircle, CheckCircle } from 'lucide-react';

interface ConsciousAvatarProps {
  avatarUrl?: string;
  username: string;
  neuralState: NeuralState;
  size?: number;
  showStatus?: boolean;
  showAura?: boolean;
  className?: string;
}

// Get appropriate aura color based on dominant neural state
const getAuraColors = (neuralState: NeuralState): string => {
  const { emotions, focus, physical } = neuralState;
  
  // Calculate dominant emotional signals
  if (emotions.excitement > 70 || emotions.happiness > 80) {
    return 'from-yellow-400 via-orange-400 to-pink-500'; // Excited/happy aura
  }
  if (emotions.calmness > 80 && emotions.anxiety < 20) {
    return 'from-blue-400 via-cyan-400 to-teal-400'; // Calm aura
  }
  if (emotions.anxiety > 60 || emotions.anger > 50) {
    return 'from-red-500 via-orange-500 to-yellow-500'; // Anxious/angry aura
  }
  if (focus.attention > 85 && focus.engagement > 80) {
    return 'from-purple-500 via-indigo-500 to-blue-500'; // Deep focus aura
  }
  if (physical.energy_level > 80) {
    return 'from-green-400 via-emerald-400 to-teal-400'; // High energy aura
  }
  if (emotions.sadness > 50) {
    return 'from-slate-400 via-gray-500 to-slate-600'; // Sad aura
  }
  
  // Default neutral aura
  return 'from-gray-400 via-slate-400 to-gray-500';
};

// Get the pulsing animation intensity based on state
const getPulseIntensity = (neuralState: NeuralState): string => {
  const { physical } = neuralState;
  if (physical.heart_rate > 100) {
    return 'animate-pulse-fast';
  }
  if (physical.heart_rate > 85) {
    return 'animate-pulse';
  }
  return 'animate-pulse-slow';
};

// Get dominant emotion icon and label
const getEmotionIndicator = (neuralState: NeuralState) => {
  const emotions = Object.entries(neuralState.emotions);
  const [dominantEmotion, value] = emotions.reduce((a, b) => a[1] > b[1] ? a : b);
  
  const emotionConfig: Record<string, { icon: React.ReactNode; label: string; bgColor: string }> = {
    happiness: { icon: <span className="text-xl">😊</span>, label: 'Happy', bgColor: 'bg-yellow-100 text-yellow-800' },
    excitement: { icon: <span className="text-xl">🤩</span>, label: 'Excited', bgColor: 'bg-orange-100 text-orange-800' },
    calmness: { icon: <span className="text-xl">😌</span>, label: 'Calm', bgColor: 'bg-blue-100 text-blue-800' },
    anxiety: { icon: <span className="text-xl">😰</span>, label: 'Anxious', bgColor: 'bg-red-100 text-red-800' },
    anger: { icon: <span className="text-xl">😤</span>, label: 'Angry', bgColor: 'bg-red-100 text-red-800' },
    sadness: { icon: <span className="text-xl">😢</span>, label: 'Sad', bgColor: 'bg-slate-100 text-slate-800' },
    surprise: { icon: <span className="text-xl">😮</span>, label: 'Surprised', bgColor: 'bg-purple-100 text-purple-800' },
    empathy: { icon: <span className="text-xl">🤗</span>, label: 'Empathetic', bgColor: 'bg-pink-100 text-pink-800' },
  };
  
  return emotionConfig[dominantEmotion] || emotionConfig.calmness;
};

export const ConsciousAvatar: React.FC<ConsciousAvatarProps> = ({
  avatarUrl,
  username,
  neuralState,
  size = 80,
  showStatus = true,
  showAura = true,
  className = '',
}) => {
  const auraColors = getAuraColors(neuralState);
  const pulseIntensity = getPulseIntensity(neuralState);
  const emotionIndicator = getEmotionIndicator(neuralState);
  const initial = username.trim().charAt(0).toUpperCase();

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Neural aura effect */}
      {showAura && (
        <div 
          className={`absolute inset-0 -m-4 rounded-full bg-gradient-to-r ${auraColors} opacity-50 blur-xl ${pulseIntensity}`}
          style={{ width: size + 32, height: size + 32 }}
        />
      )}
      
      {/* Connection quality indicator ring */}
      {showStatus && (
        <div 
          className={`absolute -inset-1 rounded-full border-4 ${
            neuralState.connectionQuality === 'excellent' ? 'border-green-500' :
            neuralState.connectionQuality === 'good' ? 'border-blue-500' :
            neuralState.connectionQuality === 'fair' ? 'border-yellow-500' : 'border-red-500'
          }`}
          style={{ width: size + 8, height: size + 8, left: -4, top: -4 }}
        />
      )}
      
      {/* Main avatar container */}
      <div 
        className="relative rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-400 to-accent-400 shadow-lg"
        style={{ width: size, height: size }}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={username}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-bold" style={{ fontSize: Math.max(16, size / 2.5) }}>
            {initial}
          </span>
        )}
        
        {/* Real-time neural overlays */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Brain wave visualization overlay when focused */}
          {neuralState.focus.attention > 80 && (
            <Brain className="absolute text-white/70 animate-pulse" style={{ width: size * 0.4, height: size * 0.4 }} />
          )}
        </div>
      </div>
      
      {/* Status badges */}
      {showStatus && (
        <>
          {/* Heart rate indicator */}
          <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1.5 shadow-md">
            <Heart className="text-white animate-pulse" style={{ width: size * 0.2, height: size * 0.2 }} />
          </div>
          
          {/* Energy level indicator */}
          {neuralState.physical.energy_level > 75 && (
            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 shadow-md">
              <Zap className="text-white" style={{ width: size * 0.2, height: size * 0.2 }} />
            </div>
          )}
          
          {/* Stress warning indicator */}
          {neuralState.emotions.anxiety > 60 && (
            <div className="absolute -top-1 -left-1 bg-orange-500 rounded-full p-1 shadow-md animate-bounce">
              <AlertCircle className="text-white" style={{ width: size * 0.2, height: size * 0.2 }} />
            </div>
          )}
          
          {/* All good indicator */}
          {neuralState.emotions.calmness > 80 && neuralState.focus.attention > 70 && (
            <div className="absolute -top-1 -left-1 bg-green-500 rounded-full p-1 shadow-md">
              <CheckCircle className="text-white" style={{ width: size * 0.2, height: size * 0.2 }} />
            </div>
          )}
        </>
      )}
      
      {/* Emotion tooltip */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity z-50">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${emotionIndicator.bgColor} shadow-lg`}>
          {emotionIndicator.label} • {Math.round(neuralState.physical.heart_rate)} BPM
        </span>
      </div>
    </div>
  );
};

export default ConsciousAvatar;