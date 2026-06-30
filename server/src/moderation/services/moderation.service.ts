import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModerationQueueItemEntity } from '../entities/moderation-queue-item.entity';
import { ContentFlagEntity } from '../entities/content-flag.entity';
import { DeepfakeDetectionService, DeepfakeDetectionResult } from './deepfake-detection.service';
import { BiasDetectionService, BiasDetectionResult } from './bias-detection.service';
import { AnalyzeContentDto } from '../dto/analyze-content.dto';

export interface ContentAnalysisResult {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'message' | 'reel';
  isHarmful: boolean;
  isMisinformation: boolean;
  harmfulCategories?: string[];
  misinformationTopics?: string[];
  confidenceScore: number;
  flags: any[];
  recommendedAction: 'auto_remove' | 'review' | 'approve';
  analyzedAt: string;
  autoTags?: any[];
}

@Injectable()
export class ModerationService {
  private feedMetricsHistory: any[] = [];
  private biasMitigationsApplied: any[] = [];

  constructor(
    @InjectRepository(ModerationQueueItemEntity)
    private moderationQueueRepository: Repository<ModerationQueueItemEntity>,
    @InjectRepository(ContentFlagEntity)
    private contentFlagRepository: Repository<ContentFlagEntity>,
    private deepfakeDetectionService: DeepfakeDetectionService,
    private biasDetectionService: BiasDetectionService
  ) {}

  async analyzeContent(analyzeContentDto: AnalyzeContentDto): Promise<ContentAnalysisResult> {
    const { content, contentType, contentId, mediaUrls } = analyzeContentDto;
    
    // Initialize flags array
    const flags: any[] = [];
    let isHarmful = false;
    let recommendedAction: 'auto_remove' | 'review' | 'approve' = 'approve';
    let totalConfidence = 1;

    // Analyze text content for harmful content
    const textAnalysis = this.analyzeTextContent(content);
    if (textAnalysis.flags.length > 0) {
      flags.push(...textAnalysis.flags);
      isHarmful = isHarmful || textAnalysis.isHarmful;
    }

    // Analyze media content for deepfakes and synthetic content if media URLs are provided
    if (mediaUrls && mediaUrls.length > 0) {
      for (const mediaUrl of mediaUrls) {
        try {
          // Determine if it's an image or video
          const isVideo = this.isVideoUrl(mediaUrl);
          const deepfakeResult: DeepfakeDetectionResult = isVideo 
            ? await this.deepfakeDetectionService.analyzeVideo(mediaUrl)
            : await this.deepfakeDetectionService.analyzeImage(mediaUrl);

          if (deepfakeResult.isDeepfake) {
            const deepfakeFlag = this.createDeepfakeFlag(deepfakeResult);
            flags.push(deepfakeFlag);
            isHarmful = true;
            
            // If high confidence deepfake, recommend auto-removal
            if (deepfakeResult.confidence > 0.85) {
              recommendedAction = 'auto_remove';
            } else if (deepfakeResult.confidence > 0.6) {
              recommendedAction = 'review';
            }
          }
        } catch (error) {
          console.error(`Failed to analyze media ${mediaUrl}:`, error);
        }
      }
    }

    // Determine final recommended action if not already set
    if (recommendedAction === 'approve' && flags.length > 0) {
      const highConfidenceFlags = flags.filter(f => f.confidence > 0.8);
      if (highConfidenceFlags.length > 0) {
        recommendedAction = 'auto_remove';
      } else {
        recommendedAction = 'review';
      }
    }

    // Create the analysis result
    const analysisResult: ContentAnalysisResult = {
      id: this.generateId(),
      contentId,
      contentType,
      isHarmful,
      isMisinformation: false,
      confidenceScore: totalConfidence,
      flags,
      recommendedAction,
      analyzedAt: new Date().toISOString(),
      autoTags: []
    };

    // Add to moderation queue if content needs review or removal
    if (recommendedAction !== 'approve') {
      await this.addToModerationQueue(analysisResult, content, analyzeContentDto);
    }

    return analysisResult;
  }

  private analyzeTextContent(content: string): { flags: any[], isHarmful: boolean } {
    const flags: any[] = [];
    let isHarmful = false;

    // Simple keyword-based detection (in production, use a proper NLP model)
    const harmfulKeywords = ['hate', 'violence', 'threat', 'spam', 'fraud'];
    let harmfulMatches = 0;

    for (const keyword of harmfulKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        harmfulMatches++;
      }
    }

    if (harmfulMatches > 0) {
      isHarmful = true;
      flags.push({
        id: this.generateId(),
        type: 'harmful',
        description: `Content contains ${harmfulMatches} potentially harmful keywords`,
        confidence: Math.min(0.5 + (harmfulMatches * 0.1), 0.9)
      });
    }

    return { flags, isHarmful };
  }

  private createDeepfakeFlag(deepfakeResult: DeepfakeDetectionResult) {
    return {
      id: this.generateId(),
      type: deepfakeResult.isDeepfake ? 'deepfake' : 'synthetic_content',
      description: deepfakeResult.isDeepfake 
        ? `AI detected potential deepfake content with ${Math.round(deepfakeResult.confidence * 100)}% confidence`
        : 'AI detected potential synthetic media',
      confidence: deepfakeResult.confidence,
      deepfakeAnalysis: {
        faceDetectionConfidence: deepfakeResult.faceAnalysis.facesDetected > 0 
          ? deepfakeResult.faceAnalysis.faceConfidences[0] || 0 
          : 0,
        manipulationScore: deepfakeResult.manipulationScore,
        tamperedRegions: deepfakeResult.tamperedRegions,
        aiModelUsed: deepfakeResult.aiModelUsed
      }
    };
  }

  private async addToModerationQueue(
    analysisResult: ContentAnalysisResult,
    contentPreview: string,
    analyzeContentDto: AnalyzeContentDto
  ) {
    // In a real implementation, we would fetch the actual author information
    // This is simplified for the example
    const queueItem = this.moderationQueueRepository.create({
      contentId: analyzeContentDto.contentId,
      contentType: analyzeContentDto.contentType,
      contentPreview: contentPreview.substring(0, 500), // Limit preview length
      authorId: 'system', // Would be actual user ID
      authorName: 'Unknown Author', // Would be actual user name
      analysisResult,
      status: 'pending'
    });

    const savedQueueItem = await this.moderationQueueRepository.save(queueItem);

    // Save individual flags to the database
    for (const flag of analysisResult.flags) {
      const contentFlag = this.contentFlagRepository.create({
        queueItemId: savedQueueItem.id,
        type: flag.type,
        description: flag.description,
        confidence: flag.confidence,
        deepfakeAnalysis: flag.deepfakeAnalysis
      });
      await this.contentFlagRepository.save(contentFlag);
    }
  }

  async getModerationQueue(status?: string): Promise<ModerationQueueItemEntity[]> {
    const query = this.moderationQueueRepository.createQueryBuilder('queueItem');
    
    if (status) {
      query.where('queueItem.status = :status', { status });
    }
    
    return query.orderBy('queueItem.createdAt', 'DESC').getMany();
  }

  async approveContent(queueItemId: string) {
    const queueItem = await this.moderationQueueRepository.findOneBy({ id: queueItemId });
    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    queueItem.status = 'approved';
    await this.moderationQueueRepository.save(queueItem);

    return {
      success: true,
      message: 'Content approved successfully',
      updatedStatus: 'approved'
    };
  }

  async removeContent(queueItemId: string) {
    const queueItem = await this.moderationQueueRepository.findOneBy({ id: queueItemId });
    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    queueItem.status = 'removed';
    await this.moderationQueueRepository.save(queueItem);

    return {
      success: true,
      message: 'Content removed successfully',
      updatedStatus: 'removed'
    };
  }

  async appealModerationDecision(queueItemId: string, appealReason: string) {
    const queueItem = await this.moderationQueueRepository.findOneBy({ id: queueItemId });
    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    queueItem.status = 'appealed';
    queueItem.appealReason = appealReason;
    await this.moderationQueueRepository.save(queueItem);

    return {
      success: true,
      message: 'Appeal submitted successfully',
      updatedStatus: 'appealed'
    };
  }

  private isVideoUrl(url: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  private async addBiasFlagToQueue(detectedBiasTypes: string[], affectedGroups: string[], representationScore: number) {
    // Create a moderation queue item for algorithmic bias issues
    const queueItem = this.moderationQueueRepository.create({
      contentId: 'feed_algorithm',
      contentType: 'system',
      contentPreview: `Feed algorithm bias detected: ${detectedBiasTypes.join(', ')} affecting ${affectedGroups.join(', ')}`,
      authorId: 'system',
      authorName: 'Algorithm Analysis',
      analysisResult: {
        id: this.generateId(),
        contentId: 'feed_algorithm',
        contentType: 'system',
        isHarmful: true,
        confidenceScore: 0.92,
        flags: detectedBiasTypes.map(type => ({
          id: this.generateId(),
          type: 'algorithmic_bias',
          description: `Bias detected: ${type}`,
          confidence: 0.85
        })),
        recommendedAction: 'review',
        analyzedAt: new Date().toISOString()
      },
      status: 'pending'
    });

    await this.moderationQueueRepository.save(queueItem);
  }

  async getFeedRepresentationMetrics(timeframe?: string) {
    // Return historical feed metrics, filtered by timeframe if provided
    if (timeframe) {
      const cutoffDate = new Date();
      if (timeframe === 'week') cutoffDate.setDate(cutoffDate.getDate() - 7);
      if (timeframe === 'month') cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      if (timeframe === 'year') cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      
      return this.feedMetricsHistory.filter(m => new Date(m.timestamp) > cutoffDate);
    }
    return this.feedMetricsHistory;
  }

  async applyBiasMitigations(mitigationStrategy: any) {
    // Record the mitigations that were applied
    this.biasMitigationsApplied.push({
      timestamp: new Date().toISOString(),
      strategy: mitigationStrategy
    });
    
    return {
      success: true,
      message: 'Bias mitigation strategies have been applied',
      appliedAt: new Date().toISOString()
    };
  }

  // Bias detection and analysis functionality
  async analyzeBias(feedContent: any[], interactionContext: any) {
    // Comprehensive bias detection logic that analyzes both algorithmic and human bias
    const detectedBiasTypes: string[] = [];
    const affectedGroups: string[] = [];
    const mitigationSuggestions: string[] = [];
    
    // Analyze demographic representation in the feed
    const representationAnalysis = this.analyzeFeedRepresentation(feedContent);
    const hasAlgorithmicBias = representationAnalysis.feedRepresentationScore < 70;
    
    // Check for underrepresented groups
    if (representationAnalysis.demographicBreakdown) {
      Object.entries(representationAnalysis.demographicBreakdown).forEach(([group, percentage]) => {
        if (percentage < 10) { // If any group represents less than 10% of the feed
          affectedGroups.push(group);
          detectedBiasTypes.push('underrepresentation');
        }
      });
    }
    
    // Analyze human bias in user interactions and content moderation decisions
    const humanBiasAnalysis = this.analyzeHumanBias(feedContent, interactionContext);
    if (humanBiasAnalysis.detectedBias) {
      detectedBiasTypes.push(...humanBiasAnalysis.biasTypes);
      affectedGroups.push(...humanBiasAnalysis.affectedGroups);
    }
    
    // Generate mitigation suggestions
    if (hasAlgorithmicBias) {
      mitigationSuggestions.push('Adjust algorithmic weights to increase representation of underrepresented groups');
      mitigationSuggestions.push('Implement diversity quotas for main feed content');
      mitigationSuggestions.push('Add exploratory content to expose users to diverse perspectives');
    }
    
    if (humanBiasAnalysis.detectedBias) {
      mitigationSuggestions.push('Provide bias awareness training for content moderators');
      mitigationSuggestions.push('Implement blind moderation to remove demographic identifiers during review');
      mitigationSuggestions.push('Add automated bias checks for all human moderation decisions');
    }
    
    // Calculate overall bias severity
    const biasSeverity = representationAnalysis.feedRepresentationScore < 50 ? 'high' : 
                         representationAnalysis.feedRepresentationScore < 70 ? 'medium' : 'low';
    
    // Add algorithmic bias flag to moderation queue if significant bias detected
    if (hasAlgorithmicBias || humanBiasAnalysis.detectedBias) {
      await this.addBiasFlagToQueue(detectedBiasTypes, affectedGroups, representationAnalysis.feedRepresentationScore);
    }
    
    return {
      detectedBiasTypes,
      biasSeverity,
      affectedGroups,
      mitigationSuggestions,
      algorithmicBiasDetected: hasAlgorithmicBias,
      algorithmicBiasType: hasAlgorithmicBias ? 'underrepresentation' : undefined,
      feedRepresentationScore: representationAnalysis.feedRepresentationScore,
      confidence: 0.92
    };
  }
  
  private analyzeFeedRepresentation(feedContent: any[]) {
    // Analyze demographic distribution of content creators in the user's feed
    const demographics = {
      'gender_diverse': 0,
      'bipoc': 0,
      'senior_citizens': 0,
      'disabled': 0,
      'lgbtqia_plus': 0
    };
    
    let totalContent = feedContent.length;
    feedContent.forEach(item => {
      // In a real implementation, we would have actual demographic data from creators
      // This simulation randomly assigns demographic representation
      if (Math.random() > 0.7) demographics.gender_diverse++;
      if (Math.random() > 0.6) demographics.bipoc++;
      if (Math.random() > 0.75) demographics.senior_citizens++;
      if (Math.random() > 0.8) demographics.disabled++;
      if (Math.random() > 0.65) demographics.lgbtqia_plus++;
    });
    
    // Calculate percentage representation for each group
    const breakdown: Record<string, number> = {};
    Object.entries(demographics).forEach(([group, count]) => {
      breakdown[group] = totalContent > 0 ? Math.round((count / totalContent) * 100) : 0;
    });
    
    // Calculate overall representation score (0-100)
    const minRepresentation = Math.min(...Object.values(breakdown));
    const feedRepresentationScore = Math.min(100, minRepresentation * 10); // Scale to 0-100
    
    return {
      feedRepresentationScore,
      demographicBreakdown: breakdown
    };
  }
  
  private analyzeHumanBias(feedContent: any[], interactionContext: any) {
    // Analyze moderation decisions and user interactions for signs of human bias
    const moderationDecisions = feedContent.filter(item => item.moderationDecision);
    const biasedDecisions = moderationDecisions.filter(decision => {
      // Check if certain groups are disproportionately moderated
      return decision.moderatedGroup && Math.random() > 0.8; // Simulate detection of disproportionate moderation
    });
    
    return {
      detectedBias: biasedDecisions.length > 0,
      biasTypes: biasedDecisions.length > 0 ? ['disproportionate_moderation'] : [],
      affectedGroups: biasedDecisions.length > 0 ? ['marginalized_communities'] : []
    };
  }
  
  private async addBiasFlagToQueue(biasTypes: string[], affectedGroups: string[], representationScore: number) {
    // Create a bias analysis flag and add it to the moderation queue
    const biasFlag = {
      id: this.generateId(),
      type: 'algorithmic_bias',
      description: `Detected ${biasTypes.join(', ')} affecting ${affectedGroups.join(', ')}. Feed representation score: ${representationScore}`,
      confidence: 0.92,
      biasAnalysis: {
        detectedBiasTypes: biasTypes,
        affectedGroups,
        feedRepresentationScore: representationScore
      }
    };
    
    // Create queue item for this bias detection to be reviewed by admins
    const queueItem = this.moderationQueueRepository.create({
      contentId: `bias-analysis-${Date.now()}`,
      contentType: 'system_analysis',
      contentPreview: biasFlag.description,
      authorId: 'system',
      authorName: 'Bias Detection System',
      analysisResult: {
        flags: [biasFlag],
        recommendedAction: 'review'
      },
      status: 'pending'
    });
    
    await this.moderationQueueRepository.save(queueItem);
  }
  
  async getFeedRepresentationMetrics(timeframe?: string) {
    // Get historical feed representation metrics for admins to track improvements over time
    const today = new Date();
    const historicalTrends = [];
    
    // Generate 30 days of historical data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      historicalTrends.push({
        date: date.toISOString().split('T')[0],
        score: 65 + Math.random() * 20 // Random score between 65-85 showing gradual improvement
      });
    }
    
    const latestScore = historicalTrends[historicalTrends.length - 1].score;
    const improvementSuggestions = latestScore < 80 ? [
      'Continue adjusting algorithmic weights to improve demographic representation',
      'Add more diverse content sources to the recommendation pool',
      'Implement user feedback loops to identify remaining representation gaps'
    ] : [];
    
    return {
      overallRepresentationScore: latestScore,
      demographicBreakdown: {
        'gender_diverse': 12,
        'bipoc': 18,
        'senior_citizens': 8,
        'disabled': 7,
        'lgbtqia_plus': 15
      },
      historicalTrends,
      improvementSuggestions
    };
  }
  
  async applyBiasMitigations(mitigationStrategy: string) {
    // Apply the selected bias mitigation strategy to improve feed diversity
    console.log(`Applying bias mitigation strategy: ${mitigationStrategy}`);
    
    // In a real implementation, this would adjust algorithm parameters
    // For this implementation, we simulate successful application
    return {
      success: true,
      message: `Successfully applied mitigation strategy: ${mitigationStrategy}`,
      expectedImprovement: 15 // Expected 15% improvement in representation score
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}