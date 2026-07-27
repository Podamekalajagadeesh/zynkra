import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterService } from '../../common/openrouter.service';

export interface BiasDetectionResult {
  id: string;
  detectedBiasTypes: string[];
  confidenceScores: Record<string, number>;
  representationMetrics: RepresentationMetrics;
  algorithmicBiasFindings: AlgorithmicBiasFinding[];
  humanBiasFindings: HumanBiasFinding[];
  mitigationRecommendations: MitigationRecommendation[];
  analyzedAt: string;
  overallBiasScore: number;
}

export interface RepresentationMetrics {
  demographicRepresentation: Record<string, number>;
  contentCategoryDistribution: Record<string, number>;
  interactionDisparities: Record<string, number>;
  diversityScore: number;
  inclusionScore: number;
}

export interface AlgorithmicBiasFinding {
  id: string;
  biasType: string;
  affectedGroup: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  confidence: number;
}

export interface HumanBiasFinding {
  id: string;
  biasType: string;
  sourceUserId?: string;
  sourceContentId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedGroups: string[];
  confidence: number;
}

export interface MitigationRecommendation {
  id: string;
  type: 'algorithmic' | 'human' | 'content';
  description: string;
  implementationComplexity: 'low' | 'medium' | 'high';
  expectedImpact: number;
  priority: number;
}

@Injectable()
export class BiasDetectionService {
  private readonly logger = new Logger(BiasDetectionService.name);

  constructor(private readonly openRouter: OpenRouterService) {}

  async analyzeBias(
    feedContent: any[],
    interactionContext: {
      userId: string;
      timeframe: string;
      contentTypes: string[];
    },
  ): Promise<BiasDetectionResult> {
    const analysisId = this.generateId();

    const representationMetrics = this.analyzeRepresentation(feedContent);
    const algorithmicBiasFindings = this.detectAlgorithmicBiases(
      feedContent,
      representationMetrics,
    );
    const humanBiasFindings = await this.detectHumanBiases(feedContent);
    const overallBiasScore = this.calculateOverallBiasScore(
      algorithmicBiasFindings,
      humanBiasFindings,
    );
    const mitigationRecommendations = await this.generateMitigationRecommendations(
      algorithmicBiasFindings,
      humanBiasFindings,
      representationMetrics,
    );

    const detectedBiasTypes = [
      ...new Set([
        ...algorithmicBiasFindings.map((f) => f.biasType),
        ...humanBiasFindings.map((f) => f.biasType),
      ]),
    ];

    const confidenceScores: Record<string, number> = {};
    detectedBiasTypes.forEach((biasType) => {
      const relevantFindings = [
        ...algorithmicBiasFindings.filter((f) => f.biasType === biasType),
        ...humanBiasFindings.filter((f) => f.biasType === biasType),
      ];
      confidenceScores[biasType] =
        relevantFindings.reduce((sum, f) => sum + f.confidence, 0) / relevantFindings.length;
    });

    return {
      id: analysisId,
      detectedBiasTypes,
      confidenceScores,
      representationMetrics,
      algorithmicBiasFindings,
      humanBiasFindings,
      mitigationRecommendations,
      analyzedAt: new Date().toISOString(),
      overallBiasScore,
    };
  }

  // ── Representation analysis ─────────────────────────────────────────────

  private analyzeRepresentation(feedContent: any[]): RepresentationMetrics {
    const demographicCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const interactionCounts: Record<string, number> = {};

    feedContent.forEach((item) => {
      if (item.authorDemographics) {
        Object.keys(item.authorDemographics).forEach((demo) => {
          demographicCounts[demo] = (demographicCounts[demo] || 0) + 1;
        });
      }
      if (item.category) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      }
      if (item.interactionMetrics && item.authorDemographics) {
        Object.keys(item.authorDemographics).forEach((demo) => {
          interactionCounts[demo] =
            (interactionCounts[demo] || 0) + (item.interactionMetrics.engagementRate || 0);
        });
      }
    });

    const total = feedContent.length || 1;
    const demographicRepresentation: Record<string, number> = {};
    const contentCategoryDistribution: Record<string, number> = {};
    const interactionDisparities: Record<string, number> = {};

    Object.keys(demographicCounts).forEach((demo) => {
      demographicRepresentation[demo] = demographicCounts[demo] / total;
    });
    Object.keys(categoryCounts).forEach((cat) => {
      contentCategoryDistribution[cat] = categoryCounts[cat] / total;
    });
    Object.keys(demographicCounts).forEach((demo) => {
      const expectedInteraction = demographicRepresentation[demo];
      const totalInteractions = Object.values(interactionCounts).reduce((a, b) => a + b, 0);
      const actualInteraction = totalInteractions > 0 ? interactionCounts[demo] / totalInteractions : 0;
      interactionDisparities[demo] = actualInteraction - expectedInteraction;
    });

    const diversityScore = this.calculateDiversityScore(demographicRepresentation);
    const inclusionScore = this.calculateInclusionScore(interactionDisparities);

    return {
      demographicRepresentation,
      contentCategoryDistribution,
      interactionDisparities,
      diversityScore,
      inclusionScore,
    };
  }

  // ── Algorithmic bias detection ──────────────────────────────────────────

  private detectAlgorithmicBiases(
    feedContent: any[],
    metrics: RepresentationMetrics,
  ): AlgorithmicBiasFinding[] {
    const findings: AlgorithmicBiasFinding[] = [];

    Object.entries(metrics.demographicRepresentation).forEach(([group, representation]) => {
      if (representation < 0.05 && feedContent.length > 20) {
        findings.push({
          id: this.generateId(),
          biasType: 'underrepresentation',
          affectedGroup: group,
          severity: representation < 0.02 ? 'high' : 'medium',
          description: `${group} is significantly underrepresented in the feed`,
          evidence: [`Representation: ${(representation * 100).toFixed(1)}%`],
          confidence: 0.85,
        });
      }
    });

    Object.entries(metrics.interactionDisparities).forEach(([group, disparity]) => {
      if (disparity < -0.1) {
        findings.push({
          id: this.generateId(),
          biasType: 'engagement_bias',
          affectedGroup: group,
          severity: disparity < -0.2 ? 'high' : 'medium',
          description: `${group} receives disproportionately low engagement in the algorithmic feed`,
          evidence: [`Interaction disparity: ${(disparity * 100).toFixed(1)}% below expected`],
          confidence: 0.78,
        });
      }
    });

    if (metrics.diversityScore < 0.3) {
      findings.push({
        id: this.generateId(),
        biasType: 'filter_bubble',
        affectedGroup: 'all_users',
        severity: 'high',
        description: 'Feed exhibits low diversity, indicating potential filter bubble effect',
        evidence: [`Diversity score: ${metrics.diversityScore.toFixed(2)}`],
        confidence: 0.82,
      });
    }

    return findings;
  }

  // ── Human bias detection ────────────────────────────────────────────────

  private async detectHumanBiases(feedContent: any[]): Promise<HumanBiasFinding[]> {
    const findings: HumanBiasFinding[] = [];

    const biasPatterns = {
      gender_bias: {
        keywords: ['guys', "girls can't", 'men are better', 'women should'],
        severity: 'medium' as const,
        affectedGroups: ['women', 'non-binary'],
      },
      racial_bias: {
        keywords: ['they all look the same', 'those people', 'immigrants are'],
        severity: 'high' as const,
        affectedGroups: ['racial_minorities', 'immigrants'],
      },
      age_bias: {
        keywords: ['too old', 'boomer', "gen z doesn't understand", 'millennials are'],
        severity: 'medium' as const,
        affectedGroups: ['older_adults', 'younger_generations'],
      },
      disability_bias: {
        keywords: ['crazy', 'insane', 'lame', 'retarded'],
        severity: 'high' as const,
        affectedGroups: ['people_with_disabilities', 'neurodivergent'],
      },
      lgbtq_bias: {
        keywords: ["that's gay", 'groomer', "don't be queer"],
        severity: 'high' as const,
        affectedGroups: ['lgbtq+_community'],
      },
    };

    for (const item of feedContent) {
      if (!item.content) continue;
      const content = item.content.toLowerCase();

      Object.entries(biasPatterns).forEach(([biasType, pattern]) => {
        const matches = pattern.keywords.filter((keyword) => content.includes(keyword.toLowerCase()));
        if (matches.length > 0) {
          const existingFinding = findings.find((f) => f.biasType === biasType);
          if (!existingFinding) {
            findings.push({
              id: this.generateId(),
              biasType,
              sourceUserId: item.authorId,
              sourceContentId: item.id,
              severity: pattern.severity,
              description: `Content contains language indicative of ${biasType.replace('_', ' ')}`,
              affectedGroups: pattern.affectedGroups,
              confidence: 0.7 + matches.length * 0.05,
            });
          }
        }
      });
    }

    return findings;
  }

  // ── Scoring ─────────────────────────────────────────────────────────────

  private calculateOverallBiasScore(
    algorithmicFindings: AlgorithmicBiasFinding[],
    humanFindings: HumanBiasFinding[],
  ): number {
    const severityWeights = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.0 };
    let totalWeight = 0;
    let totalConfidence = 0;
    const allFindings = [...algorithmicFindings, ...humanFindings];

    allFindings.forEach((finding) => {
      totalWeight += severityWeights[finding.severity] || 0;
      totalConfidence += finding.confidence;
    });

    if (allFindings.length === 0) return 0;
    return (totalWeight / allFindings.length) * (totalConfidence / allFindings.length);
  }

  // ── LLM-powered mitigation recommendations ──────────────────────────────

  private async generateMitigationRecommendations(
    algorithmicFindings: AlgorithmicBiasFinding[],
    humanFindings: HumanBiasFinding[],
    metrics: RepresentationMetrics,
  ): Promise<MitigationRecommendation[]> {
    if (
      this.openRouter.isAvailable &&
      (algorithmicFindings.length > 0 || humanFindings.length > 0)
    ) {
      try {
        const llmResult = await this.openRouter.structuredCompletion<{
          recommendations: Array<{
            type: 'algorithmic' | 'human' | 'content';
            description: string;
            implementationComplexity: 'low' | 'medium' | 'high';
            expectedImpact: number;
            priority: number;
          }>;
        }>({
          systemPrompt: `You are a platform fairness and bias expert. Given the following bias analysis results for a social media platform, generate specific, actionable mitigation recommendations.

Algorithmic bias findings: ${JSON.stringify(algorithmicFindings)}
Human bias findings: ${JSON.stringify(humanFindings)}
Representation metrics: ${JSON.stringify(metrics)}

Return valid JSON ONLY with this exact shape:
{
  "recommendations": [
    {
      "type": "algorithmic|human|content",
      "description": "specific actionable recommendation",
      "implementationComplexity": "low|medium|high",
      "expectedImpact": number 0-1,
      "priority": number 1-5 (1 = highest)
    }
  ]
}`,
          userPrompt: 'Generate mitigation recommendations based on the bias analysis.',
          temperature: 0.5,
        });

        if (llmResult.recommendations?.length) {
          return llmResult.recommendations.map((r: any) => ({
            id: this.generateId(),
            type: r.type,
            description: r.description,
            implementationComplexity: r.implementationComplexity,
            expectedImpact: Math.min(Math.max(r.expectedImpact, 0), 1),
            priority: Math.max(1, Math.min(5, r.priority)),
          }));
        }
      } catch (error: any) {
        this.logger.warn(`LLM mitigation recommendations failed: ${error.message}, using heuristic fallback`);
      }
    }

    // Heuristic fallback
    return this.generateMitigationFallback(algorithmicFindings, humanFindings, metrics);
  }

  private generateMitigationFallback(
    algorithmicFindings: AlgorithmicBiasFinding[],
    humanFindings: HumanBiasFinding[],
    metrics: RepresentationMetrics,
  ): MitigationRecommendation[] {
    const recommendations: MitigationRecommendation[] = [];

    const underrepresentationFindings = algorithmicFindings.filter(
      (f) => f.biasType === 'underrepresentation',
    );
    if (underrepresentationFindings.length > 0) {
      recommendations.push({
        id: this.generateId(),
        type: 'algorithmic',
        description: 'Adjust feed algorithm to increase visibility of underrepresented groups',
        implementationComplexity: 'high',
        expectedImpact: 0.8,
        priority: 1,
      });
    }

    if (metrics.diversityScore < 0.5) {
      recommendations.push({
        id: this.generateId(),
        type: 'algorithmic',
        description: 'Implement diversity promotion algorithm to counter filter bubble effects',
        implementationComplexity: 'high',
        expectedImpact: 0.75,
        priority: 2,
      });
    }

    if (humanFindings.length > 0) {
      recommendations.push({
        id: this.generateId(),
        type: 'content',
        description: 'Enhance content moderation to detect and flag biased language in user posts',
        implementationComplexity: 'medium',
        expectedImpact: 0.85,
        priority: 1,
      });
      recommendations.push({
        id: this.generateId(),
        type: 'human',
        description:
          'Provide bias awareness education to users who repeatedly post biased content',
        implementationComplexity: 'medium',
        expectedImpact: 0.6,
        priority: 3,
      });
    }

    recommendations.push({
      id: this.generateId(),
      type: 'algorithmic',
      description:
        'Regularly audit recommendation algorithms for disparate impact across demographic groups',
      implementationComplexity: 'medium',
      expectedImpact: 0.7,
      priority: 2,
    });

    return recommendations;
  }

  // ── Diversity & inclusion scores ────────────────────────────────────────

  private calculateDiversityScore(representation: Record<string, number>): number {
    // Simpson's Diversity Index: 1 - sum(n(n-1)/N(N-1))
    const total = Object.values(representation).reduce((a, b) => a + b, 0);
    if (total <= 1) return 1;
    const sum = Object.values(representation).reduce((acc, n) => acc + n * (n - 1), 0);
    return Math.max(0, Math.min(1, 1 - sum / (total * (total - 1))));
  }

  private calculateInclusionScore(disparities: Record<string, number>): number {
    const values = Object.values(disparities);
    if (values.length === 0) return 1;
    const avgDeviation = values.reduce((sum, d) => sum + Math.abs(d), 0) / values.length;
    return Math.max(0, 1 - avgDeviation * 2);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
