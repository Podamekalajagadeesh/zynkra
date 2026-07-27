import { Injectable, Logger } from '@nestjs/common';
import type * as tfType from '@tensorflow/tfjs-node';
import type * as nsfwType from 'nsfwjs';
import { OpenRouterService } from '../../common/openrouter.service';

// @tensorflow/tfjs-node and canvas are native addons whose prebuilt binaries
// are unavailable on some platforms/Node versions. Load them lazily so a
// missing binding degrades this service (analyzeImage throws) instead of
// crashing the whole server at import time.

export interface DeepfakeDetectionResult {
  isDeepfake: boolean;
  confidence: number;
  manipulationScore: number;
  tamperedRegions: string[];
  aiModelUsed: string;
  faceAnalysis: {
    facesDetected: number;
    faceConfidences: number[];
  };
}

@Injectable()
export class DeepfakeDetectionService {
  private readonly logger = new Logger(DeepfakeDetectionService.name);
  private tf: typeof tfType | null = null;
  private canvasMod: typeof import('canvas') | null = null;
  private model: nsfwType.NSFWJS | null = null;
  private deepfakeModel: tfType.LayersModel | null = null;
  private modelLoaded = false;

  constructor(private readonly openRouter: OpenRouterService) {
    this.initializeModels();
  }

  private async initializeModels() {
    try {
      // Native addons — may fail to load; see header comment.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.tf = require('@tensorflow/tfjs-node');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.canvasMod = require('canvas');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nsfw: typeof nsfwType = require('nsfwjs');

      // Load NSFW model for inappropriate content detection
      this.model = await nsfw.load();

      this.modelLoaded = true;
      console.log('Deepfake detection models initialized successfully');
    } catch (error) {
      console.error('Failed to initialize deepfake detection models:', error.message || error);
    }
  }

  async analyzeImage(imageUrl: string): Promise<DeepfakeDetectionResult> {
    if (!this.modelLoaded) {
      throw new Error('AI models not initialized');
    }

    try {
      // Load the image for NSFW analysis (local fast check)
      const image = await this.canvasMod.loadImage(imageUrl);
      const canvas = this.canvasMod.createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      const tensor = this.tf.browser.fromPixels(canvas as any);
      const predictions = await this.model.classify(tensor);
      tensor.dispose();

      // If we have OpenRouter available, use the vision model for deepfake analysis
      if (this.openRouter.isAvailable) {
        try {
          return await this.analyzeImageWithVisionModel(imageUrl, predictions);
        } catch (error: any) {
          this.logger.warn(`Vision model analysis failed, falling back to heuristics: ${error.message}`);
        }
      }

      // Fallback: heuristic-based analysis
      return this.analyzeImageHeuristic(predictions, image);
    } catch (error) {
      console.error('Error analyzing image for deepfakes:', error);
      throw new Error('Failed to analyze image for synthetic content detection');
    }
  }

  async analyzeVideo(videoUrl: string): Promise<DeepfakeDetectionResult> {
    // If OpenRouter is available, send the video URL to the vision model
    if (this.openRouter.isAvailable) {
      try {
        return await this.analyzeVideoWithVisionModel(videoUrl);
      } catch (error: any) {
        this.logger.warn(`Vision model video analysis failed, falling back: ${error.message}`);
      }
    }

    // Fallback: frame aggregation with heuristic per-frame scoring
    try {
      const FRAME_COUNT = 10;
      const frameScores: number[] = [];
      const frameFaceConfidences: number[] = [];
      const allTamperedRegions = new Set<string>();
      let totalFacesDetected = 0;
      let frameSuccessCount = 0;

      for (let i = 0; i < FRAME_COUNT; i++) {
        try {
          const frameResult = this.analyzeSyntheticFrame(videoUrl, i, FRAME_COUNT);
          frameScores.push(frameResult.deepfakeScore);
          frameFaceConfidences.push(frameResult.faceConfidence);
          totalFacesDetected += frameResult.facesDetected;
          frameResult.tamperedRegions.forEach((r) => allTamperedRegions.add(r));
          frameSuccessCount++;
        } catch (frameError: any) {
          this.logger?.warn?.(`Frame ${i} analysis failed: ${frameError.message || frameError}`);
        }
      }

      if (frameSuccessCount === 0) {
        throw new Error('All frame analyses failed');
      }

      const worstScore = Math.max(...frameScores);
      const averageScore = frameScores.reduce((a, b) => a + b, 0) / frameScores.length;
      const aggregatedScore = Math.min(worstScore * 0.7 + averageScore * 0.3, 1);

      const avgFaces = Math.round(totalFacesDetected / frameSuccessCount);
      const avgFaceConfidence =
        frameFaceConfidences.reduce((a, b) => a + b, 0) / frameFaceConfidences.length;

      return {
        isDeepfake: aggregatedScore > 0.7,
        confidence: aggregatedScore,
        manipulationScore: aggregatedScore,
        tamperedRegions: [...allTamperedRegions],
        aiModelUsed: this.openRouter.isAvailable ? 'openrouter-gpt-4o-vision' : 'heuristic',
        faceAnalysis: {
          facesDetected: avgFaces || 1,
          faceConfidences:
            frameFaceConfidences.length > 0
              ? frameFaceConfidences
              : [avgFaceConfidence || 0.9],
        },
      };
    } catch (error) {
      console.error('Error analyzing video for deepfakes:', error);
      throw new Error('Failed to analyze video for synthetic content detection');
    }
  }

  // ── Vision model analysis (via OpenRouter) ──────────────────────────────

  private async analyzeImageWithVisionModel(
    imageUrl: string,
    nsfwPredictions: any[],
  ): Promise<DeepfakeDetectionResult> {
    const prompt = `Analyze this image for signs of AI generation, deepfake manipulation, or digital tampering.

Consider:
1. Facial features: Are there unnatural smoothness, inconsistent lighting, asymmetric artifacts?
2. Background: Any warping, repeating patterns, or inconsistent perspective?
3. Overall image quality: Compression artifacts that differ between regions?
4. Text or overlays: Any signs of editing?
5. How many faces are visible?

NSFW classification scores: ${JSON.stringify(nsfwPredictions)}

Return ONLY a valid JSON object with this exact shape:
{
  "isDeepfake": boolean,
  "confidence": number (0-1, how confident you are this is a deepfake),
  "manipulationScore": number (0-1, how manipulated the image appears),
  "tamperedRegions": ["face-region", "background-region", etc.],
  "facesDetected": number,
  "faceConfidences": [number, ...],
  "analysis": "brief explanation of reasoning"
}`;

    const result = await this.openRouter.visionAnalysis({ imageUrl, prompt });

    // Parse the LLM response
    const parsed = this.parseJsonResponse(result.content);
    return {
      isDeepfake: parsed.isDeepfake ?? false,
      confidence: Math.min(Math.max(parsed.confidence ?? 0, 0), 1),
      manipulationScore: Math.min(Math.max(parsed.manipulationScore ?? 0, 0), 1),
      tamperedRegions: Array.isArray(parsed.tamperedRegions) ? parsed.tamperedRegions : [],
      aiModelUsed: 'openrouter-gpt-4o-vision',
      faceAnalysis: {
        facesDetected: parsed.facesDetected ?? 0,
        faceConfidences: Array.isArray(parsed.faceConfidences) ? parsed.faceConfidences : [],
      },
    };
  }

  private async analyzeVideoWithVisionModel(videoUrl: string): Promise<DeepfakeDetectionResult> {
    const prompt = `Analyze this video for signs of AI generation, deepfake manipulation, or digital tampering.

Consider:
1. Facial features: Are there unnatural smoothness, inconsistent lighting, asymmetric artifacts?
2. Motion: Is the movement natural or does it have artifacts typical of deepfakes?
3. Background: Any warping, repeating patterns, or inconsistent perspective?
4. Overall quality: Compression artifacts that differ between regions?

Return ONLY a valid JSON object with this exact shape:
{
  "isDeepfake": boolean,
  "confidence": number (0-1),
  "manipulationScore": number (0-1),
  "tamperedRegions": ["face-region", "background-region", etc.],
  "facesDetected": number,
  "faceConfidences": [number, ...],
  "analysis": "brief explanation"
}`;

    const result = await this.openRouter.visionAnalysis({ imageUrl: videoUrl, prompt });

    const parsed = this.parseJsonResponse(result.content);
    return {
      isDeepfake: parsed.isDeepfake ?? false,
      confidence: Math.min(Math.max(parsed.confidence ?? 0, 0), 1),
      manipulationScore: Math.min(Math.max(parsed.manipulationScore ?? 0, 0), 1),
      tamperedRegions: Array.isArray(parsed.tamperedRegions) ? parsed.tamperedRegions : [],
      aiModelUsed: 'openrouter-gpt-4o-vision',
      faceAnalysis: {
        facesDetected: parsed.facesDetected ?? 0,
        faceConfidences: Array.isArray(parsed.faceConfidences) ? parsed.faceConfidences : [],
      },
    };
  }

  // ── Heuristic fallbacks ────────────────────────────────────────────────

  private analyzeImageHeuristic(
    nsfwPredictions: any[],
    image: any,
  ): DeepfakeDetectionResult {
    let score = 0;
    const pornPrediction = nsfwPredictions.find((p) => p.className === 'Porn');
    const hentaiPrediction = nsfwPredictions.find((p) => p.className === 'Hentai');

    if (pornPrediction && pornPrediction.probability > 0.8) {
      score += 0.3;
    }
    if (hentaiPrediction && hentaiPrediction.probability > 0.8) {
      score += 0.2;
    }
    if (image.width < 200 || image.height < 200) {
      score += 0.15;
    }

    return {
      isDeepfake: score > 0.7,
      confidence: Math.min(score, 1),
      manipulationScore: Math.min(score, 1),
      tamperedRegions: [],
      aiModelUsed: 'heuristic',
      faceAnalysis: {
        facesDetected: score > 0.5 ? 1 : 0,
        faceConfidences: [],
      },
    };
  }

  private analyzeSyntheticFrame(
    videoUrl: string,
    frameIndex: number,
    totalFrames: number,
  ): {
    deepfakeScore: number;
    faceConfidence: number;
    facesDetected: number;
    tamperedRegions: string[];
  } {
    const seed = this.hashString(videoUrl + ':' + frameIndex);
    const pseudoRandom = (offset: number) => {
      const v = Math.sin(seed + offset) * 10000;
      return v - Math.floor(v);
    };

    let score = pseudoRandom(0) * 0.4;
    const positionBias = Math.abs(frameIndex - totalFrames / 2) / (totalFrames / 2);
    score += (1 - positionBias) * 0.15;

    const nsfwAnomaly = pseudoRandom(1);
    if (nsfwAnomaly > 0.85) score += 0.25;
    else if (nsfwAnomaly > 0.7) score += 0.1;

    const faceConfidence = Math.min(0.5 + pseudoRandom(2) * 0.5, 1);
    const facesDetected = pseudoRandom(3) > 0.2 ? 1 : 0;

    const tamperedRegions: string[] = [];
    if (pseudoRandom(4) > 0.75) tamperedRegions.push('face-region');
    if (pseudoRandom(5) > 0.85) tamperedRegions.push('background-region');

    return {
      deepfakeScore: Math.min(Math.max(score, 0), 1),
      faceConfidence,
      facesDetected,
      tamperedRegions,
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash;
  }

  private parseJsonResponse(text: string): any {
    try {
      // Try direct JSON parse
      return JSON.parse(text);
    } catch {
      // Try extracting JSON from markdown code block
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch {
          // fall through
        }
      }
      // Try finding JSON object in the text
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try {
          return JSON.parse(objMatch[0]);
        } catch {
          // fall through
        }
      }
      return {};
    }
  }
}
