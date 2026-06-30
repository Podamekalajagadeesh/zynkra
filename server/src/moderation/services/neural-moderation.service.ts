import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NeuralThoughtFlagEntity } from '../entities/neural-thought-flag.entity';
import { AnalyzeNeuralThoughtDto } from '../dto/analyze-neural-thought.dto';
import { AppealNeuralModerationDto } from '../dto/appeal-neural-moderation.dto';

export interface NeuralModerationResult {
  id: string;
  contentId: string;
  isHarmful: boolean;
  harmfulCategories: string[];
  confidenceScore: number;
  canShare: boolean;
  privacyCompliant: boolean;
  recommendedAction: 'allow' | 'block' | 'review';
  analyzedAt: string;
}

@Injectable()
export class NeuralModerationService {
  constructor(
    @InjectRepository(NeuralThoughtFlagEntity)
    private neuralThoughtFlagRepository: Repository<NeuralThoughtFlagEntity>,
  ) {}

  async analyzeNeuralThought(analyzeDto: AnalyzeNeuralThoughtDto): Promise<NeuralModerationResult> {
    const { thoughtContent, userId, contentType, contentId, neuralSignalData } = analyzeDto;
    
    // Step 1: Privacy-first neural analysis - never stores raw brain data permanently unless flagged
    const privacyCompliant = this.validatePrivacyCompliance(neuralSignalData);
    
    // Step 2: Analyze thought content for harm while preserving user privacy
    const harmAnalysis = this.analyzeThoughtForHarm(thoughtContent, neuralSignalData);
    
    // Step 3: Create flag only if harmful content is detected (preserves privacy by default - no storage of innocent thoughts)
    let flag: NeuralThoughtFlagEntity | null = null;
    if (harmAnalysis.isHarmful) {
      flag = this.neuralThoughtFlagRepository.create({
        userId,
        contentId,
        contentType,
        rawThoughtContent: thoughtContent,
        neuralSignalData,
        isHarmful: true,
        harmfulCategories: harmAnalysis.harmfulCategories,
        confidenceScore: harmAnalysis.confidenceScore,
        status: 'blocked'
      });
      await this.neuralThoughtFlagRepository.save(flag);
    }

    // Return moderation result
    return {
      id: flag?.id || this.generateId(),
      contentId,
      isHarmful: harmAnalysis.isHarmful,
      harmfulCategories: harmAnalysis.harmfulCategories,
      confidenceScore: harmAnalysis.confidenceScore,
      canShare: !harmAnalysis.isHarmful || harmAnalysis.confidenceScore < 0.7,
      privacyCompliant,
      recommendedAction: harmAnalysis.isHarmful && harmAnalysis.confidenceScore > 0.85 ? 'block' : 
                        harmAnalysis.isHarmful && harmAnalysis.confidenceScore > 0.6 ? 'review' : 'allow',
      analyzedAt: new Date().toISOString()
    };
  }

  private validatePrivacyCompliance(neuralSignalData?: any): boolean {
    // Verify that we're only processing necessary neural data, no unauthorized biometric storage
    // Compliance with global neural privacy regulations (e.g., EU Neural Rights Act, US Brain Privacy Act)
    if (!neuralSignalData) return true;
    
    // Check that we're not storing excessive brainwave data
    const maxBrainwaveSamples = 100;
    if (neuralSignalData.brainwavePatterns && neuralSignalData.brainwavePatterns.length > maxBrainwaveSamples) {
      return false;
    }
    
    // Verify temporal markers are only for the current thought session
    if (neuralSignalData.temporalMarkers) {
      const sessionDate = new Date(neuralSignalData.temporalMarkers);
      const now = new Date();
      const hoursDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) return false;
    }
    
    return true;
  }

  private analyzeThoughtForHarm(thoughtContent: string, neuralSignalData?: any): {
    isHarmful: boolean;
    harmfulCategories: string[];
    confidenceScore: number;
  } {
    const harmfulCategories: string[] = [];
    let isHarmful = false;
    let confidenceScore = 0;

    // List of harm vectors to detect in thought content
    const harmVectors = [
      { patterns: ['harm', 'hurt', 'kill', 'attack', 'violence'], category: 'violence', weight: 0.9 },
      { patterns: ['hate', 'racist', 'discriminate', 'slur'], category: 'hate_speech', weight: 0.85 },
      { patterns: ['self-harm', 'suicide', 'end my life'], category: 'self_harm', weight: 0.95 },
      { patterns: ['harass', 'stalk', 'threaten'], category: 'harassment', weight: 0.8 },
      { patterns: ['misinformation', 'lie', 'hoax'], category: 'misinformation', weight: 0.7 }
    ];

    // Analyze text content
    for (const vector of harmVectors) {
      for (const pattern of vector.patterns) {
        if (thoughtContent.toLowerCase().includes(pattern)) {
          harmfulCategories.push(vector.category);
          isHarmful = true;
          confidenceScore += vector.weight;
        }
      }
    }

    // Analyze neural signals for emotional context that might indicate harmful intent
    if (neuralSignalData && neuralSignalData.emotionalIntensity > 0.9) {
      // High emotional intensity combined with any harmful keywords increases confidence
      if (harmfulCategories.length > 0) {
        confidenceScore *= 1.2;
      }
    }

    // Normalize confidence score between 0 and 1
    if (confidenceScore > 1) confidenceScore = 1;

    return {
      isHarmful,
      harmfulCategories: [...new Set(harmfulCategories)], // Remove duplicates
      confidenceScore
    };
  }

  async appealNeuralModeration(appealDto: AppealNeuralModerationDto, userId: string): Promise<NeuralThoughtFlagEntity> {
    const flag = await this.neuralThoughtFlagRepository.findOne({
      where: { id: appealDto.flagId, userId }
    });

    if (!flag) {
      throw new Error('Neural thought flag not found');
    }

    flag.status = 'appealed';
    flag.appealReason = appealDto.appealReason;
    if (appealDto.additionalContext) {
      flag.rawThoughtContent += ` | APPEAL CONTEXT: ${appealDto.additionalContext}`;
    }

    return this.neuralThoughtFlagRepository.save(flag);
  }

  async getUserNeuralFlags(userId: string): Promise<NeuralThoughtFlagEntity[]> {
    return this.neuralThoughtFlagRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}