import { Injectable, Logger } from '@nestjs/common';

/**
 * Advanced AI-powered content moderation service.
 * Detects harmful content, spam, harassment, and policy violations.
 */
@Injectable()
export class AdvancedModerationService {
  private readonly logger = new Logger(AdvancedModerationService.name);

  // Spam detection patterns
  private readonly spamPatterns = [
    /buy now/i, /limited time offer/i, /click here/i, /act now/i,
    /free money/i, /earn \$\d+/i, /make money fast/i, /100% free/i,
    /follow for follow/i, /f4f/i, /l4l/i, /like for like/i,
    /dm me/i, /check my bio/i, /link in bio/i,
    /crypto pump/i, /guaranteed returns/i, /passive income/i,
    /buy followers/i, /buy likes/i,
  ];

  // Harassment detection keywords
  private readonly harassmentKeywords = [
    'kill yourself', 'kys', 'go die', 'worthless', 'stupid idiot',
    'ugly', 'fat', 'disgusting', 'pathetic', 'loser', 'trash',
  ];

  // Hate speech detection
  private readonly hateSpeechPatterns = [
    /\b(n[i1]gg?er|faggot|retard|retarded|tranny|dyke)\b/i,
  ];

  // NSFW detection
  private readonly nsfwPatterns = [
    /nsfw/i, /18\+/, /adult only/i, /nude/i, /naked/i,
  ];

  constructor() {}

  /**
   * Analyze content for moderation flags.
   */
  analyzeContent(content: string, context?: {
    authorId?: string;
    authorReputation?: number;
    isPublic?: boolean;
    contentType?: 'post' | 'message' | 'comment';
  }): {
    isSafe: boolean;
    flags: string[];
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    action: 'none' | 'warn' | 'flag' | 'hide' | 'block';
    categories: string[];
  } {
    const flags: string[] = [];
    const categories: string[] = [];
    let severity: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';

    // Check spam
    const spamScore = this.checkSpam(content);
    if (spamScore > 0.7) {
      flags.push('spam');
      categories.push('spam');
      severity = 'high';
    } else if (spamScore > 0.4) {
      flags.push('possible-spam');
      categories.push('spam');
      severity = 'medium';
    }

    // Check harassment
    const harassmentScore = this.checkHarassment(content);
    if (harassmentScore > 0.8) {
      flags.push('harassment');
      categories.push('harassment');
      severity = 'critical';
    } else if (harassmentScore > 0.5) {
      flags.push('possible-harassment');
      categories.push('harassment');
      severity = 'high';
    }

    // Check hate speech
    const hateSpeechScore = this.checkHateSpeech(content);
    if (hateSpeechScore > 0.9) {
      flags.push('hate-speech');
      categories.push('hate-speech');
      severity = 'critical';
    }

    // Check NSFW
    const nsfwScore = this.checkNsfw(content);
    if (nsfwScore > 0.7) {
      flags.push('nsfw');
      categories.push('nsfw');
      severity = severity === 'critical' ? 'critical' : 'medium';
    }

    // Check personal attacks
    const personalAttackScore = this.checkPersonalAttacks(content);
    if (personalAttackScore > 0.6) {
      flags.push('personal-attack');
      categories.push('harassment');
      severity = severity === 'critical' ? 'critical' : 'high';
    }

    // Determine confidence
    const confidence = Math.max(spamScore, harassmentScore, hateSpeechScore, nsfwScore, personalAttackScore);

    // Determine action
    let action: 'none' | 'warn' | 'flag' | 'hide' | 'block' = 'none';
    if (severity === 'critical') action = 'block';
    else if (severity === 'high') action = 'hide';
    else if (severity === 'medium') action = 'flag';
    else if (severity !== 'none') action = 'warn';

    return {
      isSafe: severity === 'none',
      flags,
      severity,
      confidence: Math.min(confidence, 1),
      action,
      categories: [...new Set(categories)],
    };
  }

  /**
   * Check spam patterns.
   */
  private checkSpam(content: string): number {
    let score = 0;
    for (const pattern of this.spamPatterns) {
      if (pattern.test(content)) score += 0.3;
    }
    // Excessive links
    const linkCount = (content.match(/https?:\/\//g) || []).length;
    if (linkCount > 3) score += 0.3;
    // Excessive emojis
    const emojiCount = (content.match(/[\u{1F000}-\u{1FFFF}]/gu) || []).length;
    if (emojiCount > 10) score += 0.2;
    // Repeated characters
    if (/(.)\1{4,}/.test(content)) score += 0.2;
    return Math.min(score, 1);
  }

  /**
   * Check harassment patterns.
   */
  private checkHarassment(content: string): number {
    const lower = content.toLowerCase();
    let score = 0;
    for (const keyword of this.harassmentKeywords) {
      if (lower.includes(keyword)) score += 0.4;
    }
    // ALL CAPS (aggressive)
    if (content === content.toUpperCase() && content.length > 10) score += 0.2;
    // Excessive exclamation marks
    if ((content.match(/!/g) || []).length > 5) score += 0.1;
    return Math.min(score, 1);
  }

  /**
   * Check hate speech patterns.
   */
  private checkHateSpeech(content: string): number {
    for (const pattern of this.hateSpeechPatterns) {
      if (pattern.test(content)) return 1;
    }
    return 0;
  }

  /**
   * Check NSFW content.
   */
  private checkNsfw(content: string): number {
    let score = 0;
    for (const pattern of this.nsfwPatterns) {
      if (pattern.test(content)) score += 0.3;
    }
    return Math.min(score, 1);
  }

  /**
   * Check for personal attacks.
   */
  private checkPersonalAttacks(content: string): number {
    let score = 0;
    const lower = content.toLowerCase();
    if (/you are (a )?(idiot|moron|stupid|dumb|useless)/.test(lower)) score += 0.5;
    if (/shut up/.test(lower)) score += 0.2;
    if (/go away/.test(lower)) score += 0.2;
    if (/nobody (likes|cares about) you/.test(lower)) score += 0.5;
    return Math.min(score, 1);
  }

  /**
   * Generate moderation report for a user.
   */
  async generateUserReport(userId: string): Promise<{
    userId: string;
    totalFlags: number;
    spamFlags: number;
    harassmentFlags: number;
    overallRisk: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    // In production, this would query the database for flag history
    return {
      userId,
      totalFlags: 0,
      spamFlags: 0,
      harassmentFlags: 0,
      overallRisk: 'low',
      recommendations: [],
    };
  }

  /**
   * Get moderation stats.
   */
  async getModerationStats(): Promise<{
    totalAnalyzed: number;
    totalFlagged: number;
    byCategory: Record<string, number>;
    averageSeverity: string;
  }> {
    return {
      totalAnalyzed: 0,
      totalFlagged: 0,
      byCategory: { spam: 0, harassment: 0, 'hate-speech': 0, nsfw: 0 },
      averageSeverity: 'none',
    };
  }
}
