import { Injectable, Logger } from '@nestjs/common';

export enum SentimentType {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

export interface SentimentAnalysisResult {
  sentiment: SentimentType;
  score: number; // -1 to 1, negative to positive
  confidence: number; // 0 to 1
  emotions?: {
    joy?: number;
    sadness?: number;
    anger?: number;
    fear?: number;
    surprise?: number;
  };
}

@Injectable()
export class SentimentService {
  private readonly logger = new Logger(SentimentService.name);
  
  // Simple lexicon-based sentiment analysis implementation
  // In production, you would use a proper ML model or API like AWS Comprehend, Google Cloud Natural Language, etc.
  private positiveWords = new Set([
    'good', 'great', 'awesome', 'excellent', 'amazing', 'love', 'like', 'best', 'perfect',
    'happy', 'wonderful', 'fantastic', 'nice', 'cool', 'brilliant', 'outstanding', 'superb',
    'beautiful', 'fun', 'exciting', 'incredible', 'impressive', 'thank', 'thanks', 'appreciate',
    'blessed', 'blessing', 'joy', 'joyful', 'grateful', 'congrats', 'congratulations', 'win',
    'winning', 'success', 'successful', 'amazing', 'genius', 'smart', 'intelligent', 'kind',
    'helpful', 'supportive', 'awesome', 'phenomenal', 'magnificent', 'spectacular'
  ]);

  private negativeWords = new Set([
    'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'worst', 'worse', 'sad',
    'angry', 'stupid', 'idiot', 'fuck', 'shit', 'crap', 'bs', 'bullshit', 'garbage', 'trash',
    'sucks', 'suck', 'disappointed', 'disappointing', 'pathetic', 'useless', 'pathetic',
    'annoying', 'frustrating', 'frustrated', 'ugly', 'disgusting', 'gross', 'awful', 'dumb',
    'loser', 'failure', 'fail', 'failed', 'terrible', 'horrendous', 'atrocious', 'abysmal',
    'horrific', 'worrisome', 'worrying', 'scary', 'scared', 'afraid', 'terrified', 'pitiful',
    'ridiculous', 'absurd', 'lousy', 'pathetic', 'inferior', 'poor', 'weak', 'lazy', 'cheap',
    'nasty', 'mean', 'cruel', 'rude', 'disrespectful', 'toxic', 'harmful', 'bad', 'wrong'
  ]);

  async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
    this.logger.log(`Analyzing sentiment for text: ${text.substring(0, 100)}...`);
    
    const words = text.toLowerCase().split(/\W+/);
    let positiveCount = 0;
    let negativeCount = 0;
    let totalWords = words.filter(word => word.length > 2).length;

    for (const word of words) {
      if (this.positiveWords.has(word)) {
        positiveCount++;
      }
      if (this.negativeWords.has(word)) {
        negativeCount++;
      }
    }

    const score = totalWords > 0 ? (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1) : 0;
    let sentiment: SentimentType;
    
    if (score > 0.2) {
      sentiment = SentimentType.POSITIVE;
    } else if (score < -0.2) {
      sentiment = SentimentType.NEGATIVE;
    } else {
      sentiment = SentimentType.NEUTRAL;
    }

    // Calculate confidence based on number of sentiment words found
    const totalSentimentWords = positiveCount + negativeCount;
    const confidence = totalSentimentWords > 0 ? Math.min(totalSentimentWords / 5, 0.95) : 0.5;

    // Simple emotion detection
    const emotions = this.detectEmotions(text);

    const result: SentimentAnalysisResult = {
      sentiment,
      score: Math.max(-1, Math.min(1, score)), // Clamp between -1 and 1
      confidence,
      emotions
    };

    this.logger.log(`Sentiment analysis complete: ${JSON.stringify(result)}`);
    return result;
  }

  private detectEmotions(text: string): SentimentAnalysisResult['emotions'] {
    const lowerText = text.toLowerCase();
    const emotions: SentimentAnalysisResult['emotions'] = {};

    // Joy indicators
    if (/\b(happy|joyful|excited|thrilled|delighted|love|awesome|great)\b/.test(lowerText)) {
      emotions.joy = 0.8;
    }

    // Sadness indicators
    if (/\b(sad|unhappy|depressed|heartbroken|miserable|disappointed)\b/.test(lowerText)) {
      emotions.sadness = 0.8;
    }

    // Anger indicators
    if (/\b(angry|furious|mad|pissed|outraged|infuriated|annoyed)\b/.test(lowerText)) {
      emotions.anger = 0.8;
    }

    // Fear indicators
    if (/\b(scared|afraid|terrified|worried|anxious|nervous|fearful)\b/.test(lowerText)) {
      emotions.fear = 0.7;
    }

    // Surprise indicators
    if (/\b(wow|surprised|shocked|amazed|unbelievable|wow|whoa)\b/.test(lowerText)) {
      emotions.surprise = 0.7;
    }

    return emotions;
  }
}