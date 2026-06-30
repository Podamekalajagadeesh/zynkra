import { API_BASE_URL } from '../lib/api';
import { AutoTag } from '../lib/types';

export interface ContentAnalysisResult {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'message' | 'reel' | 'neural_thought';
  isHarmful: boolean;
  isMisinformation: boolean;
  harmfulCategories?: string[];
  misinformationTopics?: string[];
  confidenceScore: number;
  flags: ContentFlag[];
  recommendedAction: 'auto_remove' | 'review' | 'approve';
  analyzedAt: string;
  autoTags?: AutoTag[]; // AI-generated auto-tags for content categorization
  neuralThoughtAnalysis?: NeuralThoughtAnalysisResult; // Additional analysis for neural thought content
}

export interface NeuralThoughtAnalysisResult {
  thoughtClarity: number; // How clear the thought is (0-100)
  emotionalContext: string[]; // Detected emotions in the thought
  intentClassification: string; // Classified intent (informative, personal, conversational, harmful)
  privacySensitivity: 'low' | 'medium' | 'high'; // How sensitive the thought content is
  processingTimeMs: number; // Time taken to process the neural signal
  onDeviceProcessing: boolean; // Whether processing happened on the user's device (preserves privacy)
}

export interface BiasAnalysisResult {
  detectedBiasTypes: string[];
  biasSeverity: 'low' | 'medium' | 'high';
  affectedGroups: string[];
  mitigationSuggestions: string[];
  algorithmicBiasDetected: boolean;
  algorithmicBiasType?: string;
  feedRepresentationScore: number; // 0-100 score for demographic representation in feeds
  confidence: number;
}

export interface ContentFlag {
  id: string;
  type: 'harmful' | 'misinformation' | 'hate_speech' | 'violence' | 'adult_content' | 'spam' | 'fraud' | 'deepfake' | 'synthetic_content' | 'neural_harmful_intent' | 'algorithmic_bias' | 'human_bias';
  description: string;
  confidence: number;
  deepfakeAnalysis?: {
    faceDetectionConfidence: number;
    manipulationScore: number;
    tamperedRegions?: string[];
    aiModelUsed: string;
  };
  neuralSignalAnalysis?: {
    signalSource: string;
    processedLocally: boolean;
    detectedContext: string[];
  };
  biasAnalysis?: BiasAnalysisResult;
}

export interface ModerationQueueItem {
  id: string;
  contentId: string;
  contentType: string;
  contentPreview: string;
  authorId: string;
  authorName: string;
  analysisResult: ContentAnalysisResult;
  status: 'pending' | 'approved' | 'removed' | 'appealed';
  createdAt: string;
  updatedAt: string;
}

export interface ModerationAction {
  success: boolean;
  message: string;
  updatedStatus: string;
}

// Analyze content for harmful content and misinformation
export async function analyzeContent(
  content: string,
  contentType: 'post' | 'comment' | 'message' | 'reel' | 'neural_thought',
  contentId: string,
  mediaUrls?: string[],
  neuralSignalData?: {
    rawSignal?: number[];
    deviceId?: string;
    implantVersion?: string;
  }
): Promise<ContentAnalysisResult> {
  // For neural thoughts, run on-device pre-screening first to preserve privacy
  if (contentType === 'neural_thought') {
    const localAnalysis = runLocalNeuralModeration(content, neuralSignalData);
    if (localAnalysis.flags.some(flag => flag.type === 'neural_harmful_intent' && flag.confidence > 0.9)) {
      // Immediately block harmful thoughts before they even reach any server
      return {
        ...localAnalysis,
        id: `neural-analysis-${Date.now()}`,
        contentId,
        contentType,
        isHarmful: true,
        isMisinformation: false,
        confidenceScore: 0.95,
        recommendedAction: 'auto_remove',
        analyzedAt: new Date().toISOString(),
      };
    }
    return localAnalysis;
  }

  const response = await fetch(`${API_BASE_URL}/moderation/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      content,
      contentType,
      contentId,
      mediaUrls,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze content');
  }

  return response.json();
}

// Local on-device neural moderation that runs entirely on the user's device to preserve privacy
// No raw neural data or thought content is ever sent to servers if harmful intent is detected
function runLocalNeuralModeration(
  thoughtContent: string,
  neuralSignalData?: {
    rawSignal?: number[];
    deviceId?: string;
    implantVersion?: string;
  }
): ContentAnalysisResult {
  const startTime = performance.now();
  
  // Comprehensive keyword-based detection for all ethical violations (in production, this would be an on-device ML model)
  const harmfulKeywords = ['harm', 'hurt', 'kill', 'attack', 'threat', 'violence', 'hate', 'abuse', 'hurt', 'injure', 'damage'];
  const misinformationKeywords = ['fake news', 'false', 'lie', 'mislead', 'conspiracy', 'hoax', 'disinformation', 'manipulate', 'fabricate'];
  const manipulationKeywords = ['influence', 'control', 'exploit', 'trick', 'deceive', 'manipulate', 'coerce', 'pressure', 'brainwash'];
  
  const detectedHarmfulTerms: string[] = [];
  const detectedMisinformationTerms: string[] = [];
  const detectedManipulationTerms: string[] = [];
  
  harmfulKeywords.forEach(keyword => {
    if (thoughtContent.toLowerCase().includes(keyword)) {
      detectedHarmfulTerms.push(keyword);
    }
  });
  
  misinformationKeywords.forEach(keyword => {
    if (thoughtContent.toLowerCase().includes(keyword)) {
      detectedMisinformationTerms.push(keyword);
    }
  });
  
  manipulationKeywords.forEach(keyword => {
    if (thoughtContent.toLowerCase().includes(keyword)) {
      detectedManipulationTerms.push(keyword);
    }
  });

  const isHarmful = detectedHarmfulTerms.length > 0;
  const isMisinformation = detectedMisinformationTerms.length > 0;
  const isManipulation = detectedManipulationTerms.length > 0;
  const endTime = performance.now();

  // Detect emotional context from keywords
  const emotionalContext: string[] = [];
  const emotionKeywords: Record<string, string[]> = {
    'positive': ['happy', 'love', 'amazing', 'wonderful', 'grateful', 'excited'],
    'negative': ['sad', 'angry', 'frustrated', 'upset', 'disappointed'],
    'reflective': ['thinking', 'wondering', 'contemplating', 'considering'],
    'excited': ['excited', 'thrilled', 'pumped', 'can\'t wait']
  };

  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    if (keywords.some(keyword => thoughtContent.toLowerCase().includes(keyword))) {
      emotionalContext.push(emotion);
    }
  });

  // Create flags if any harmful content is detected
  const flags: ContentFlag[] = [];
  
  if (isHarmful) {
    flags.push({
      id: `neural-flag-${Date.now()}-1`,
      type: 'neural_harmful_intent',
      description: `Potentially harmful thought detected: contains terms that may indicate harmful intent`,
      confidence: 0.92,
      neuralSignalAnalysis: {
        signalSource: neuralSignalData?.deviceId || 'unknown-neural-implant',
        processedLocally: true,
        detectedContext: detectedHarmfulTerms
      }
    });
  }
  
  if (isMisinformation) {
    flags.push({
      id: `neural-flag-${Date.now()}-2`,
      type: 'misinformation',
      description: `Potential misinformation detected: contains terms associated with spreading false information`,
      confidence: 0.89,
      neuralSignalAnalysis: {
        signalSource: neuralSignalData?.deviceId || 'unknown-neural-implant',
        processedLocally: true,
        detectedContext: detectedMisinformationTerms
      }
    });
  }
  
  if (isManipulation) {
    flags.push({
      id: `neural-flag-${Date.now()}-3`,
      type: 'manipulation',
      description: `Potential manipulation detected: contains terms associated with manipulating others`,
      confidence: 0.91,
      neuralSignalAnalysis: {
        signalSource: neuralSignalData?.deviceId || 'unknown-neural-implant',
        processedLocally: true,
        detectedContext: detectedManipulationTerms
      }
    });
  }

  const hasAnyViolations = isHarmful || isMisinformation || isManipulation;
  
  return {
    id: `neural-analysis-${Date.now()}`,
    contentId: `thought-${Date.now()}`,
    contentType: 'neural_thought',
    isHarmful,
    isMisinformation,
    confidenceScore: hasAnyViolations ? 0.91 : 0.98,
    flags,
    recommendedAction: hasAnyViolations ? 'auto_remove' : 'approve',
    analyzedAt: new Date().toISOString(),
    neuralThoughtAnalysis: {
      thoughtClarity: 85 + Math.random() * 15, // Random clarity score between 85-100
      emotionalContext: emotionalContext.length > 0 ? emotionalContext : ['neutral'],
      intentClassification: isHarmful ? 'harmful' : isMisinformation ? 'misleading' : isManipulation ? 'manipulative' : 'conversational',
      privacySensitivity: 'medium',
      processingTimeMs: Math.round(endTime - startTime),
      onDeviceProcessing: true // Critical: all processing happened on the user's device, preserving privacy
    }
  };
}

// Get moderation queue for admins/moderators
export async function getModerationQueue(status?: string): Promise<ModerationQueueItem[]> {
  const url = status 
    ? `${API_BASE_URL}/moderation/queue?status=${status}` 
    : `${API_BASE_URL}/moderation/queue`;
    
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch moderation queue');
  }

  return response.json();
}

// Approve content that was flagged for review
export async function approveContent(queueItemId: string): Promise<ModerationAction> {
  const response = await fetch(`${API_BASE_URL}/moderation/${queueItemId}/approve`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to approve content');
  }

  return response.json();
}

// Remove harmful/misinformation content
export async function removeContent(queueItemId: string): Promise<ModerationAction> {
  const response = await fetch(`${API_BASE_URL}/moderation/${queueItemId}/remove`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to remove content');
  }

  return response.json();
}

// Analyze social interactions and content feeds for algorithmic and human bias
export async function analyzeBias(
  feedContent: any[],
  interactionContext: {
    userId: string;
    timeframe: string;
    contentTypes: string[];
  }
): Promise<BiasAnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/moderation/bias/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      feedContent,
      interactionContext
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze bias in content feeds');
  }

  return response.json();
}

// Get feed representation metrics to track demographic diversity in user feeds
export async function getFeedRepresentationMetrics(timeframe?: string): Promise<{
  overallRepresentationScore: number;
  demographicBreakdown: Record<string, number>;
  historicalTrends: Array<{date: string; score: number}>;
  improvementSuggestions: string[];
}> {
  const url = timeframe 
    ? `${API_BASE_URL}/moderation/bias/feed-metrics?timeframe=${timeframe}` 
    : `${API_BASE_URL}/moderation/bias/feed-metrics`;
    
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch feed representation metrics');
  }

  return response.json();
}

// Apply bias mitigation strategies to improve feed diversity
export async function applyBiasMitigations(mitigationStrategy: string): Promise<{
  success: boolean;
  message: string;
  expectedImprovement: number;
}> {
  const response = await fetch(`${API_BASE_URL}/moderation/bias/apply-mitigations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ mitigationStrategy }),
  });

  if (!response.ok) {
    throw new Error('Failed to apply bias mitigation strategies');
  }

  return response.json();
}

// Get user's content moderation history
export async function getUserModerationHistory(): Promise<ContentAnalysisResult[]> {
  const response = await fetch(`${API_BASE_URL}/moderation/user/history`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch moderation history');
  }

  return response.json();
}

// Appeal a moderation decision
export async function appealModerationDecision(queueItemId: string, appealReason: string): Promise<ModerationAction> {
  const response = await fetch(`${API_BASE_URL}/moderation/${queueItemId}/appeal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ appealReason }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit appeal');
  }

  return response.json();
}