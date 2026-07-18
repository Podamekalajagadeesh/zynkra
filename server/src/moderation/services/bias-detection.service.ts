import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface BiasDetectionResult {
  id: string;
  detectedBiasTypes: string[];
  confidenceScores: Record<string, number>;
  representationMetrics: RepresentationMetrics;
  algorithmicBiasFindings: AlgorithmicBiasFinding[];
  humanBiasFindings: HumanBiasFinding[];
  mitigationRecommendations: MitigationRecommendation[];
  analyzedAt: string;
  overallBiasScore: number; // 0 = no bias, 1 = severe bias
}

export interface RepresentationMetrics {
  demographicRepresentation: Record<string, number>;
  contentCategoryDistribution: Record<string, number>;
  interactionDisparities: Record<string, number>;
  diversityScore: number; // 0-1, higher is more diverse
  inclusionScore: number; // 0-1, higher is more inclusive
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
  expectedImpact: number; // 0-1
  priority: number; // 1 (highest) to 5 (lowest)
}

@Injectable()
export class BiasDetectionService {
  constructor() {}

  async analyzeBias(
    feedContent: any[],
    interactionContext: { userId: string; timeframe: string; contentTypes: string[] }
  ): Promise<BiasDetectionResult> {
    // Generate unique ID
    const analysisId = this.generateId();
    
    // Step 1: Analyze demographic representation in the feed
    const representationMetrics = this.analyzeRepresentation(feedContent);
    
    // Step 2: Detect algorithmic biases
    const algorithmicBiasFindings = this.detectAlgorithmicBiases(feedContent, representationMetrics);
    
    // Step 3: Detect human-generated biases in content
    const humanBiasFindings = await this.detectHumanBiases(feedContent);
    
    // Step 4: Calculate overall bias score
    const overallBiasScore = this.calculateOverallBiasScore(algorithmicBiasFindings, humanBiasFindings);
    
    // Step 5: Generate mitigation recommendations
    const mitigationRecommendations = this.generateMitigationRecommendations(
      algorithmicBiasFindings,
      humanBiasFindings,
      representationMetrics
    );
    
    // Compile all detected bias types
    const detectedBiasTypes = [
      ...new Set([
        ...algorithmicBiasFindings.map(f => f.biasType),
        ...humanBiasFindings.map(f => f.biasType)
      ])
    ];
    
    // Calculate confidence scores for each bias type
    const confidenceScores: Record<string, number> = {};
    detectedBiasTypes.forEach(biasType => {
      const relevantFindings = [
        ...algorithmicBiasFindings.filter(f => f.biasType === biasType),
        ...humanBiasFindings.filter(f => f.biasType === biasType)
      ];
      confidenceScores[biasType] = relevantFindings.reduce((sum, f) => sum + f.confidence, 0) / relevantFindings.length;
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
      overallBiasScore
    };
  }

  private analyzeRepresentation(feedContent: any[]): RepresentationMetrics {
    const demographicCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const interactionCounts: Record<string, number> = {};
    
    // Process feed content to gather representation data
    feedContent.forEach(item => {
      // Track demographics of content creators
      if (item.authorDemographics) {
        Object.keys(item.authorDemographics).forEach(demo => {
          demographicCounts[demo] = (demographicCounts[demo] || 0) + 1;
        });
      }
      
      // Track content categories
      if (item.category) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      }
      
      // Track interaction rates
      if (item.interactionMetrics && item.authorDemographics) {
        Object.keys(item.authorDemographics).forEach(demo => {
          interactionCounts[demo] = (interactionCounts[demo] || 0) + (item.interactionMetrics.engagementRate || 0);
        });
      }
    });
    
    // Normalize counts to percentages
    const total = feedContent.length || 1;
    const demographicRepresentation: Record<string, number> = {};
    const contentCategoryDistribution: Record<string, number> = {};
    const interactionDisparities: Record<string, number> = {};
    
    Object.keys(demographicCounts).forEach(demo => {
      demographicRepresentation[demo] = demographicCounts[demo] / total;
    });
    
    Object.keys(categoryCounts).forEach(cat => {
      contentCategoryDistribution[cat] = categoryCounts[cat] / total;
    });
    
    // Calculate interaction disparities compared to representation
    Object.keys(demographicCounts).forEach(demo => {
      const expectedInteraction = demographicRepresentation[demo];
      const actualInteraction = interactionCounts[demo] / (Object.values(interactionCounts).reduce((a, b) => a + b, 0) || 1);
      interactionDisparities[demo] = actualInteraction - expectedInteraction;
    });
    
    // Calculate diversity and inclusion scores
    const diversityScore = this.calculateDiversityScore(demographicRepresentation);
    const inclusionScore = this.calculateInclusionScore(interactionDisparities);
    
    return {
      demographicRepresentation,
      contentCategoryDistribution,
      interactionDisparities,
      diversityScore,
      inclusionScore
    };
  }

  private detectAlgorithmicBiases(feedContent: any[], metrics: RepresentationMetrics): AlgorithmicBiasFinding[] {
    const findings: AlgorithmicBiasFinding[] = [];
    
    // Check for underrepresented groups
    Object.entries(metrics.demographicRepresentation).forEach(([group, representation]) => {
      if (representation < 0.05 && feedContent.length > 20) { // Less than 5% representation in significant sample
        findings.push({
          id: this.generateId(),
          biasType: 'underrepresentation',
          affectedGroup: group,
          severity: representation < 0.02 ? 'high' : 'medium',
          description: `${group} is significantly underrepresented in the feed`,
          evidence: [`Representation: ${(representation * 100).toFixed(1)}%`],
          confidence: 0.85
        });
      }
    });
    
    // Check for interaction disparities
    Object.entries(metrics.interactionDisparities).forEach(([group, disparity]) => {
      if (disparity < -0.1) { // 10% less interaction than expected
        findings.push({
          id: this.generateId(),
          biasType: 'engagement_bias',
          affectedGroup: group,
          severity: disparity < -0.2 ? 'high' : 'medium',
          description: `${group} receives disproportionately low engagement in the algorithmic feed`,
          evidence: [`Interaction disparity: ${(disparity * 100).toFixed(1)}% below expected`],
          confidence: 0.78
        });
      }
    });
    
    // Check for filter bubble effect
    if (metrics.diversityScore < 0.3) {
      findings.push({
        id: this.generateId(),
        biasType: 'filter_bubble',
        affectedGroup: 'all_users',
        severity: 'high',
        description: 'Feed exhibits low diversity, indicating potential filter bubble effect',
        evidence: [`Diversity score: ${metrics.diversityScore.toFixed(2)}`],
        confidence: 0.82
      });
    }
    
    return findings;
  }

  private async detectHumanBiases(feedContent: any[]): Promise<HumanBiasFinding[]> {
    const findings: HumanBiasFinding[] = [];
    
    // Bias-related keywords and patterns to detect
    const biasPatterns = {
      gender_bias: {
        keywords: ['guys', 'girls can\'t', 'men are better', 'women should'],
        severity: 'medium' as const,
        affectedGroups: ['women', 'non-binary']
      },
      racial_bias: {
        keywords: ['they all look the same', 'those people', 'immigrants are'],
        severity: 'high' as const,
        affectedGroups: ['racial_minorities', 'immigrants']
      },
      age_bias: {
        keywords: ['too old', 'boomer', 'gen z doesn\'t understand', 'millennials are'],
        severity: 'medium' as const,
        affectedGroups: ['older_adults', 'younger_generations']
      },
      disability_bias: {
        keywords: ['crazy', 'insane', 'lame', 'retarded'],
        severity: 'high' as const,
        affectedGroups: ['people_with_disabilities', 'neurodivergent']
      },
      lgbtq_bias: {
        keywords: ['that\'s gay', 'groomer', 'don\'t be queer'],
        severity: 'high' as const,
        affectedGroups: ['lgbtq+_community']
      }
    };
    
    // Analyze each piece of content for human-generated bias
    for (const item of feedContent) {
      if (!item.content) continue;
      
      const content = item.content.toLowerCase();
      
      Object.entries(biasPatterns).forEach(([biasType, pattern]) => {
        const matches = pattern.keywords.filter(keyword => content.includes(keyword.toLowerCase()));
        
        if (matches.length > 0) {
          const existingFinding = findings.find(f => f.biasType === biasType);
          
          if (!existingFinding) {
            findings.push({
              id: this.generateId(),
              biasType,
              sourceUserId: item.authorId,
              sourceContentId: item.id,
              severity: pattern.severity,
              description: `Content contains language indicative of ${biasType.replace('_', ' ')}`,
              affectedGroups: pattern.affectedGroups,
              confidence: 0.7 + (matches.length * 0.05) // Increase confidence with more matches
            });
          }
        }
      });
    }
    
    return findings;
  }

  private calculateOverallBiasScore(
    algorithmicFindings: AlgorithmicBiasFinding[],
    humanFindings: HumanBiasFinding[]
  ): number {
    const severityWeights = {
      'low': 0.2,
      'medium': 0.5,
      'high': 0.8,
      'critical': 1.0
    };
    
    let totalWeight = 0;
    let totalConfidence = 0;
    const allFindings = [...algorithmicFindings, ...humanFindings];
    
    allFindings.forEach(finding => {
      totalWeight += severityWeights[finding.severity];
      totalConfidence += finding.confidence;
    });
    
    if (allFindings.length === 0) return 0;
    
    const avgWeight = totalWeight / allFindings.length;
    const avgConfidence = totalConfidence / allFindings.length;
    
    return avgWeight * avgConfidence;
  }

  private generateMitigationRecommendations(
    algorithmicFindings: AlgorithmicBiasFinding[],
    humanFindings: HumanBiasFinding[],
    metrics: RepresentationMetrics
  ): MitigationRecommendation[] {
    const recommendations: MitigationRecommendation[] = [];
    
    // Address underrepresentation
    const underrepresentationFindings = algorithmicFindings.filter(f => f.biasType === 'underrepresentation');
    if (underrepresentationFindings.length > 0) {
      recommendations.push({
        id: this.generateId(),
        type: 'algorithmic',
        description: 'Adjust feed algorithm to increase visibility of underrepresented groups',
        implementationComplexity: 'high',
        expectedImpact: 0.8,
        priority: 1
      });
    }
    
    // Address low diversity
    if (metrics.diversityScore < 0.5) {
      recommendations.push({
        id: this.generateId(),
        type: 'algorithmic',
        description: 'Implement diversity promotion algorithm to counter filter bubble effects',
        implementationComplexity: 'high',
        expectedImpact: 0.75,
        priority: 2
      });
    }
    
    // Address human-generated biases
    if (humanFindings.length > 0) {
      recommendations.push({
        id: this.generateId(),
        type: 'content',
        description: 'Enhance content moderation to detect and flag biased language in user posts',
        implementationComplexity: 'medium',
        expectedImpact: 0.85,
        priority: 1
      });
      
      recommendations.push({
        id: this.generateId(),
        type: 'human',
        description: 'Provide bias awareness education to users who repeatedly post biased content',
        implementationComplexity: 'medium',
        expectedImpact: 0.6,
        priority: 3
      });
    }
    
    // General recommendations
    recommendations.push({
      id: this.generateId(),
      type: 'algorithmic',
      description: 'Regularly audit recommendation algorithms for disparate impact across demographic groups',
      implementationComplexity: 'medium',
      expectedImpact: 0.7,
      priority: 2
    });
    
    return recommendations;
  }

  private calculateDiversityScore(representation: Record<string, number>): number {
    // Simpson's Diversity Index: 1 - sum(n(n-1)/N(N-1))
    const total = Object.values(representation).reduce((a, b) => a + b, 0);
    if (total <= 1) return 1;
    
    const sum = Object.values(representation).reduce((acc, n) => acc + (n * (n - 1)), 0);
    const diversity = 1 - (sum / (total * (total - 1)));
    
    return Math.max(0, Math.min(1, diversity));
  }

  private calculateInclusionScore(disparities: Record<string, number>): number {
    // Calculate based on average deviation from expected interaction rates
    const values = Object.values(disparities);
    if (values.length === 0) return 1;
    
    const avgDeviation = values.reduce((sum, d) => sum + Math.abs(d), 0) / values.length;
    return Math.max(0, 1 - avgDeviation * 2); // Scale to 0-1
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}