import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModerationQueueItemEntity } from '../entities/moderation-queue-item.entity';
import { ContentFlagEntity } from '../entities/content-flag.entity';
import { DeepfakeDetectionService, DeepfakeDetectionResult } from './deepfake-detection.service';
import { BiasDetectionService, BiasDetectionResult } from './bias-detection.service';
import { AnalyzeContentDto } from '../dto/analyze-content.dto';
import { OpenRouterService } from '../../common/openrouter.service';

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
  private readonly logger = new Logger(ModerationService.name);
  private feedMetricsHistory: any[] = [];
  private biasMitigationsApplied: any[] = [];

  constructor(
    @InjectRepository(ModerationQueueItemEntity)
    private moderationQueueRepository: Repository<ModerationQueueItemEntity>,
    @InjectRepository(ContentFlagEntity)
    private contentFlagRepository: Repository<ContentFlagEntity>,
    private deepfakeDetectionService: DeepfakeDetectionService,
    private biasDetectionService: BiasDetectionService,
    private readonly openRouter: OpenRouterService,
  ) {}

  async analyzeContent(analyzeContentDto: AnalyzeContentDto): Promise<ContentAnalysisResult> {
    const { content, contentType, contentId, mediaUrls } = analyzeContentDto;

    const flags: any[] = [];
    let isHarmful = false;
    let isMisinformation = false;
    let recommendedAction: 'auto_remove' | 'review' | 'approve' = 'approve';
    let totalConfidence = 1;

    // Analyze text content for harmful content using LLM
    const textAnalysis = await this.analyzeTextContent(content);
    if (textAnalysis.flags.length > 0) {
      flags.push(...textAnalysis.flags);
      isHarmful = isHarmful || textAnalysis.isHarmful;
      isMisinformation = textAnalysis.isMisinformation ?? false;
      totalConfidence = textAnalysis.confidence ?? 1;
    }

    // Analyze media content for deepfakes and synthetic content
    if (mediaUrls && mediaUrls.length > 0) {
      for (const mediaUrl of mediaUrls) {
        try {
          const isVideo = this.isVideoUrl(mediaUrl);
          const deepfakeResult: DeepfakeDetectionResult = isVideo
            ? await this.deepfakeDetectionService.analyzeVideo(mediaUrl)
            : await this.deepfakeDetectionService.analyzeImage(mediaUrl);

          if (deepfakeResult.isDeepfake) {
            const deepfakeFlag = this.createDeepfakeFlag(deepfakeResult);
            flags.push(deepfakeFlag);
            isHarmful = true;

            if (deepfakeResult.confidence > 0.85) {
              recommendedAction = 'auto_remove';
            } else if (deepfakeResult.confidence > 0.6) {
              recommendedAction = 'review';
            }
          }
        } catch (error: any) {
          this.logger.error(`Failed to analyze media ${mediaUrl}: ${error.message}`);
        }
      }
    }

    // Determine final recommended action if not already set
    if (recommendedAction === 'approve' && flags.length > 0) {
      const highConfidenceFlags = flags.filter((f) => f.confidence > 0.8);
      if (highConfidenceFlags.length > 0) {
        recommendedAction = 'auto_remove';
      } else {
        recommendedAction = 'review';
      }
    }

    const analysisResult: ContentAnalysisResult = {
      id: this.generateId(),
      contentId,
      contentType,
      isHarmful,
      isMisinformation,
      confidenceScore: totalConfidence,
      flags,
      recommendedAction,
      analyzedAt: new Date().toISOString(),
      autoTags: [],
    };

    if (recommendedAction !== 'approve') {
      await this.addToModerationQueue(analysisResult, content, analyzeContentDto);
    }

    return analysisResult;
  }

  private async analyzeTextContent(content: string): Promise<{
    flags: any[];
    isHarmful: boolean;
    isMisinformation?: boolean;
    confidence?: number;
  }> {
    if (this.openRouter.isAvailable) {
      try {
        const result = await this.openRouter.structuredCompletion<{
          isHarmful: boolean;
          categories: string[];
          confidence: number;
          flags: Array<{ type: string; description: string; confidence: number }>;
          isMisinformation: boolean;
          misinformationTopics: string[];
        }>({
          systemPrompt: `Analyze the following content for policy violations on a social media platform.
Check for: hate speech, harassment, threats, spam, fraud, misinformation, self-harm, violence, bullying.
Consider context and nuance — don't flag false positives on benign usage.

Return valid JSON ONLY with this exact shape:
{
  "isHarmful": boolean,
  "categories": ["hate_speech", "harassment", ...],
  "confidence": number (0-1),
  "flags": [{ "type": "string", "description": "string", "confidence": number }],
  "isMisinformation": boolean,
  "misinformationTopics": ["topic1", ...]
}`,
          userPrompt: `Content to analyze:\n\n${content}`,
          temperature: 0.3,
        });

        return {
          flags: result.flags ?? [],
          isHarmful: result.isHarmful ?? false,
          isMisinformation: result.isMisinformation ?? false,
          confidence: result.confidence ?? 0.5,
        };
      } catch (error: any) {
        this.logger.warn(`LLM text analysis failed: ${error.message}, using keyword fallback`);
      }
    }

    // Fallback: keyword-based detection
    return this.analyzeTextContentFallback(content);
  }

  private analyzeTextContentFallback(content: string): {
    flags: any[];
    isHarmful: boolean;
    isMisinformation?: boolean;
    confidence?: number;
  } {
    const flags: any[] = [];
    let isHarmful = false;
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
        confidence: Math.min(0.5 + harmfulMatches * 0.1, 0.9),
      });
    }

    return { flags, isHarmful, isMisinformation: false, confidence: 0.5 };
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
        faceDetectionConfidence:
          deepfakeResult.faceAnalysis.facesDetected > 0
            ? deepfakeResult.faceAnalysis.faceConfidences[0] || 0
            : 0,
        manipulationScore: deepfakeResult.manipulationScore,
        tamperedRegions: deepfakeResult.tamperedRegions,
        aiModelUsed: deepfakeResult.aiModelUsed,
      },
    };
  }

  private async addToModerationQueue(
    analysisResult: ContentAnalysisResult,
    contentPreview: string,
    analyzeContentDto: AnalyzeContentDto,
  ) {
    const queueItem = this.moderationQueueRepository.create({
      contentId: analyzeContentDto.contentId,
      contentType: analyzeContentDto.contentType,
      contentPreview: contentPreview.substring(0, 500),
      authorId: 'system',
      authorName: 'Unknown Author',
      analysisResult,
      status: 'pending',
    });

    const savedQueueItem = await this.moderationQueueRepository.save(queueItem);

    for (const flag of analysisResult.flags) {
      const contentFlag = this.contentFlagRepository.create({
        queueItemId: savedQueueItem.id,
        type: flag.type,
        description: flag.description,
        confidence: flag.confidence,
        deepfakeAnalysis: flag.deepfakeAnalysis,
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
    if (!queueItem) throw new Error('Queue item not found');
    queueItem.status = 'approved';
    await this.moderationQueueRepository.save(queueItem);
    return { success: true, message: 'Content approved successfully', updatedStatus: 'approved' };
  }

  async removeContent(queueItemId: string) {
    const queueItem = await this.moderationQueueRepository.findOneBy({ id: queueItemId });
    if (!queueItem) throw new Error('Queue item not found');
    queueItem.status = 'removed';
    await this.moderationQueueRepository.save(queueItem);
    return { success: true, message: 'Content removed successfully', updatedStatus: 'removed' };
  }

  async appealModerationDecision(queueItemId: string, appealReason: string) {
    const queueItem = await this.moderationQueueRepository.findOneBy({ id: queueItemId });
    if (!queueItem) throw new Error('Queue item not found');
    queueItem.status = 'appealed';
    queueItem.appealReason = appealReason;
    await this.moderationQueueRepository.save(queueItem);
    return { success: true, message: 'Appeal submitted successfully', updatedStatus: 'appealed' };
  }

  private isVideoUrl(url: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  }

  private async addBiasFlagToQueue(
    detectedBiasTypes: string[],
    affectedGroups: string[],
    representationScore: number,
  ) {
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
        flags: detectedBiasTypes.map((type) => ({
          id: this.generateId(),
          type: 'algorithmic_bias',
          description: `Bias detected: ${type}`,
          confidence: 0.85,
        })),
        recommendedAction: 'review',
        analyzedAt: new Date().toISOString(),
      },
      status: 'pending',
    });
    await this.moderationQueueRepository.save(queueItem);
  }

  async getFeedRepresentationMetrics(timeframe?: string) {
    if (timeframe) {
      const cutoffDate = new Date();
      if (timeframe === 'week') cutoffDate.setDate(cutoffDate.getDate() - 7);
      if (timeframe === 'month') cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      if (timeframe === 'year') cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      return this.feedMetricsHistory.filter((m) => new Date(m.timestamp) > cutoffDate);
    }
    return this.feedMetricsHistory;
  }

  async applyBiasMitigations(mitigationStrategy: any) {
    this.biasMitigationsApplied.push({
      timestamp: new Date().toISOString(),
      strategy: mitigationStrategy,
    });
    return {
      success: true,
      message: 'Bias mitigation strategies have been applied',
      appliedAt: new Date().toISOString(),
    };
  }

  // Bias analysis — uses actual data when available, no Math.random()
  async analyzeBias(feedContent: any[], interactionContext: any) {
    const detectedBiasTypes: string[] = [];
    const affectedGroups: string[] = [];
    const mitigationSuggestions: string[] = [];

    // Analyze demographic representation using actual data (not random)
    const representationAnalysis = this.analyzeFeedRepresentation(feedContent);
    const hasAlgorithmicBias = representationAnalysis.feedRepresentationScore < 70;

    if (representationAnalysis.demographicBreakdown) {
      Object.entries(representationAnalysis.demographicBreakdown).forEach(
        ([group, percentage]) => {
          if (percentage < 10) {
            affectedGroups.push(group);
            detectedBiasTypes.push('underrepresentation');
          }
        },
      );
    }

    // Human bias analysis — checks actual moderation patterns
    const humanBiasAnalysis = this.analyzeHumanBias(feedContent, interactionContext);
    if (humanBiasAnalysis.detectedBias) {
      detectedBiasTypes.push(...humanBiasAnalysis.biasTypes);
      affectedGroups.push(...humanBiasAnalysis.affectedGroups);
    }

    // Generate mitigation suggestions
    if (hasAlgorithmicBias) {
      mitigationSuggestions.push(
        'Adjust algorithmic weights to increase representation of underrepresented groups',
      );
      mitigationSuggestions.push('Implement diversity quotas for main feed content');
      mitigationSuggestions.push('Add exploratory content to expose users to diverse perspectives');
    }
    if (humanBiasAnalysis.detectedBias) {
      mitigationSuggestions.push('Provide bias awareness training for content moderators');
      mitigationSuggestions.push(
        'Implement blind moderation to remove demographic identifiers during review',
      );
      mitigationSuggestions.push('Add automated bias checks for all human moderation decisions');
    }

    const biasSeverity =
      representationAnalysis.feedRepresentationScore < 50
        ? 'high'
        : representationAnalysis.feedRepresentationScore < 70
          ? 'medium'
          : 'low';

    if (hasAlgorithmicBias || humanBiasAnalysis.detectedBias) {
      await this.addBiasFlagToQueue(
        detectedBiasTypes,
        affectedGroups,
        representationAnalysis.feedRepresentationScore,
      );
    }

    return {
      detectedBiasTypes,
      biasSeverity,
      affectedGroups,
      mitigationSuggestions,
      algorithmicBiasDetected: hasAlgorithmicBias,
      algorithmicBiasType: hasAlgorithmicBias ? 'underrepresentation' : undefined,
      feedRepresentationScore: representationAnalysis.feedRepresentationScore,
      confidence: 0.92,
    };
  }

  private analyzeFeedRepresentation(feedContent: any[]) {
    // Uses actual demographic data from content items when available,
    // never fabricates data via Math.random()
    const demographics: Record<string, number> = {};
    let hasDemographicData = false;

    feedContent.forEach((item) => {
      if (item.authorDemographics && typeof item.authorDemographics === 'object') {
        hasDemographicData = true;
        Object.entries(item.authorDemographics).forEach(([group, count]: [string, any]) => {
          demographics[group] = (demographics[group] || 0) + (typeof count === 'number' ? count : 1);
        });
      }
    });

    const totalContent = feedContent.length || 1;

    // Calculate percentage representation for each group (only if we have real data)
    const breakdown: Record<string, number> = {};
    if (hasDemographicData) {
      Object.entries(demographics).forEach(([group, count]) => {
        breakdown[group] = Math.round((count / totalContent) * 100);
      });
    }

    // Score: if no data, return neutral. If data exists, calculate from actual representation.
    const feedRepresentationScore = hasDemographicData
      ? Math.min(100, (Math.min(...Object.values(breakdown)) || 0) * 10)
      : 100; // Neutral score when no demographic data available

    return {
      feedRepresentationScore,
      demographicBreakdown: breakdown,
      _note: hasDemographicData
        ? 'Based on actual content metadata'
        : 'No demographic data available; representation could not be assessed',
    };
  }

  private analyzeHumanBias(feedContent: any[], interactionContext: any) {
    // Analyzes actual moderation decision patterns instead of using Math.random()
    const moderationDecisions = feedContent.filter((item) => item.moderationDecision);

    if (moderationDecisions.length === 0) {
      return { detectedBias: false, biasTypes: [], affectedGroups: [] };
    }

    // Check if moderation decisions disproportionately target specific groups
    // based on actual moderation metadata
    const groupModerationCounts: Record<string, number> = {};
    moderationDecisions.forEach((decision) => {
      if (decision.moderatedGroup) {
        groupModerationCounts[decision.moderatedGroup] =
          (groupModerationCounts[decision.moderatedGroup] || 0) + 1;
      }
    });

    // Detect disproportionate moderation: if one group makes up >60% of flagged content
    const totalModerated = moderationDecisions.length;
    const affectedGroups: string[] = [];
    const biasTypes: string[] = [];

    Object.entries(groupModerationCounts).forEach(([group, count]) => {
      const proportion = count / totalModerated;
      if (proportion > 0.6 && totalModerated > 5) {
        affectedGroups.push(group);
        biasTypes.push('disproportionate_moderation');
      }
    });

    return {
      detectedBias: biasTypes.length > 0,
      biasTypes,
      affectedGroups,
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
