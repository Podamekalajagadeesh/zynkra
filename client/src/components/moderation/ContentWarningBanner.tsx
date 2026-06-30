import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ContentAnalysisResult } from '../../services/contentModerationService';

interface ContentWarningBannerProps {
  analysis: ContentAnalysisResult;
  onDismiss?: () => void;
  showDismiss?: boolean;
  className?: string;
}

export function ContentWarningBanner({ 
  analysis, 
  onDismiss, 
  showDismiss = false,
  className = ''
}: ContentWarningBannerProps) {
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  const hasDeepfake = analysis.flags.some(f => f.type === 'deepfake');
  const hasSyntheticContent = analysis.flags.some(f => f.type === 'synthetic_content');
  const hasNeuralHarmfulIntent = analysis.flags.some(f => f.type === 'neural_harmful_intent');
  const isNeuralThought = analysis.contentType === 'neural_thought';

  const getWarningTitle = () => {
    if (hasNeuralHarmfulIntent) {
      return '🧠 Neural Moderation: Potentially Harmful Thought Detected';
    } else if (hasDeepfake) {
      return '⚠️ AI Deepfake Content Detected';
    } else if (hasSyntheticContent) {
      return '⚠️ Synthetic AI-Generated Content Identified';
    } else if (analysis.isHarmful && analysis.isMisinformation) {
      return 'This content may contain harmful material and misinformation';
    } else if (analysis.isHarmful) {
      return 'This content may contain harmful material';
    } else if (analysis.isMisinformation) {
      return 'This content may contain misinformation';
    }
    return 'This content has been flagged for review';
  };

  const getWarningDescription = () => {
    const descriptions: string[] = [];
    if (hasNeuralHarmfulIntent) {
      const neuralFlag = analysis.flags.find(f => f.type === 'neural_harmful_intent');
      if (neuralFlag?.neuralSignalAnalysis) {
        descriptions.push(`Detection confidence: ${Math.round(neuralFlag.confidence * 100)}%`);
        descriptions.push(`Processed locally on your device: ${neuralFlag.neuralSignalAnalysis.processedLocally ? 'Yes' : 'No'}`);
        if (neuralFlag.neuralSignalAnalysis.detectedContext && neuralFlag.neuralSignalAnalysis.detectedContext.length > 0) {
          descriptions.push(`Detected context: ${neuralFlag.neuralSignalAnalysis.detectedContext.join(', ')}`);
        }
        if (analysis.neuralThoughtAnalysis) {
          descriptions.push(`Thought clarity: ${Math.round(analysis.neuralThoughtAnalysis.thoughtClarity)}%`);
          descriptions.push(`Privacy protection: Active - no thought data sent to servers`);
        }
      }
    } else if (hasDeepfake) {
      const deepfakeFlag = analysis.flags.find(f => f.type === 'deepfake');
      if (deepfakeFlag?.deepfakeAnalysis) {
        descriptions.push(`Deepfake detection confidence: ${Math.round(deepfakeFlag.confidence * 100)}%`);
        descriptions.push(`Manipulation score: ${Math.round(deepfakeFlag.deepfakeAnalysis.manipulationScore * 100)}%`);
        if (deepfakeFlag.deepfakeAnalysis.tamperedRegions && deepfakeFlag.deepfakeAnalysis.tamperedRegions.length > 0) {
          descriptions.push(`Tampered regions: ${deepfakeFlag.deepfakeAnalysis.tamperedRegions.join(', ')}`);
        }
        descriptions.push(`AI model: ${deepfakeFlag.deepfakeAnalysis.aiModelUsed}`);
      }
    }
    if (hasSyntheticContent) {
      const syntheticFlag = analysis.flags.find(f => f.type === 'synthetic_content');
      if (syntheticFlag) {
        descriptions.push(`Synthetic content confidence: ${Math.round(syntheticFlag.confidence * 100)}%`);
      }
    }
    if (analysis.harmfulCategories && analysis.harmfulCategories.length > 0) {
      descriptions.push(`Harmful categories: ${analysis.harmfulCategories.join(', ')}`);
    }
    if (analysis.misinformationTopics && analysis.misinformationTopics.length > 0) {
      descriptions.push(`Potential misinformation topics: ${analysis.misinformationTopics.join(', ')}`);
    }
    return descriptions.join(' | ');
  };

  const getWarningStyles = () => {
    if (hasNeuralHarmfulIntent) {
      return 'bg-red-50 border-red-400';
    } else if (hasDeepfake) {
      return 'bg-red-50 border-red-300';
    } else if (hasSyntheticContent) {
      return 'bg-orange-50 border-orange-300';
    }
    return 'bg-amber-50 border-amber-200';
  };

  const getTextColors = () => {
    if (hasNeuralHarmfulIntent) {
      return { header: 'text-red-900', body: 'text-red-800', icon: 'text-red-700' };
    } else if (hasDeepfake) {
      return { header: 'text-red-800', body: 'text-red-700', icon: 'text-red-600' };
    } else if (hasSyntheticContent) {
      return { header: 'text-orange-800', body: 'text-orange-700', icon: 'text-orange-600' };
    }
    return { header: 'text-amber-800', body: 'text-amber-700', icon: 'text-amber-600' };
  };

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  const colors = getTextColors();
  const styles = getWarningStyles();

  return (
    <div className={`${styles} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`h-5 w-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium ${colors.header}`}>{getWarningTitle()}</h4>
            {showDismiss && (
              <button 
                onClick={handleDismiss}
                className={`${colors.icon} hover:opacity-80`}
                aria-label="Dismiss warning"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {(expanded || analysis.flags.length <= 2) && (
            <p className={`text-sm ${colors.body} mt-1`}>{getWarningDescription()}</p>
          )}
          {analysis.flags.length > 2 && !expanded && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(true)}
              className={`${colors.body} hover:opacity-80 p-0 h-auto mt-1 text-sm underline`}
            >
              Show more details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}