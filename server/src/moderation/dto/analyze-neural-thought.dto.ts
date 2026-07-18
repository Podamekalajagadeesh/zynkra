export class AnalyzeNeuralThoughtDto {
  thoughtContent: string;
  userId: string;
  contentType: 'thought_post' | 'telepathic_message' | 'memory_share';
  neuralSignalData?: {
    brainwavePatterns: number[];
    emotionalIntensity: number;
    contextualCues: string[];
    temporalMarkers: string;
  };
  contentId: string;
}