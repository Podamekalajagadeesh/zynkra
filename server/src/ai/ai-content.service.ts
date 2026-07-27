import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { OpenRouterService } from '../common/openrouter.service';
import { ChatDto } from './dto/chat.dto';

/**
 * AI Content Creation Service.
 *
 * Provides content suggestions, post optimization, hashtag recommendations,
 * caption generation, and writing assistance. When an OpenRouter API key is
 * configured, calls the LLM for real AI-generated content; otherwise falls
 * back to the built-in template engine.
 */
@Injectable()
export class AiContentService {
  private readonly logger = new Logger(AiContentService.name);

  // ── Template fallbacks (preserved from original implementation) ──────────

  private readonly templates = {
    announcement: [
      "Big news! We're excited to announce {topic} 🎉\n\n{details}\n\nStay tuned for more updates!",
      "It's official! {topic} is here.\n\n{details}\n\nLet us know what you think in the comments 👇",
      "We've been working on something special...\n\nIntroducing {topic}!\n\n{details}",
    ],
    tutorial: [
      "Want to learn how to {topic}? 🧵\n\nHere's a quick guide:\n\n1. {step1}\n2. {step2}\n3. {step3}\n\nSave this for later!",
      "New to {topic}? Here's everything you need to know:\n\n{details}\n\nWhat questions do you have?",
      "Step-by-step: How to {topic}\n\n{details}\n\nShare this with someone who needs it!",
    ],
    opinion: [
      "Hot take: {topic}\n\nHere's why I think {argument}:\n\n{details}\n\nWhat's your take? Let's discuss below 👇",
      "I've been thinking about {topic} lately.\n\n{details}\n\nCurious to hear different perspectives on this.",
      "Unpopular opinion: {topic}\n\n{details}\n\nChange my mind in the comments!",
    ],
    promotional: [
      "Check out {topic}! 🚀\n\n{details}\n\nAvailable now!",
      "You asked, we delivered. Presenting {topic}!\n\n{details}\n\nGet started today.",
      "Something new is here! ✨\n\n{topic}\n{details}\n\nDon't miss out!",
    ],
    question: [
      "Quick question for the timeline:\n\n{topic}?\n\n{details}\n\nDrop your answer below!",
      "I'd love to hear your thoughts on this:\n\n{topic}\n{details}",
      "Help me decide! 🤔\n\n{topic}\n\n{details}\n\nVote in the poll!",
    ],
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly openRouter: OpenRouterService,
  ) {}

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Generate post content based on topic and type.
   */
  async generateContent(params: {
    topic: string;
    type: 'announcement' | 'tutorial' | 'opinion' | 'promotional' | 'question' | 'story' | 'caption';
    details?: string;
    tone?: 'professional' | 'casual' | 'humorous' | 'inspirational';
    keywords?: string[];
  }): Promise<{ content: string[]; hashtags: string[]; readingTime: number }> {
    if (this.openRouter.isAvailable) {
      try {
        const result = await this.openRouter.structuredCompletion<{
          content: string[];
          hashtags: string[];
        }>({
          systemPrompt: `You are a social media content writer for Zynkra, a social platform.
Generate ${params.type} content about "${params.topic}".
${params.tone ? `Tone: ${params.tone}` : ''}
${params.details ? `Additional context: ${params.details}` : ''}
${params.keywords?.length ? `Keywords to incorporate: ${params.keywords.join(', ')}` : ''}

Return valid JSON ONLY with this exact shape:
{ "content": ["variant1", "variant2", "variant3"], "hashtags": ["#tag1", "#tag2", ...] }

Each content variant should be 1-3 paragraphs suitable for a social media post.`,
          userPrompt: `Write ${params.type} content about "${params.topic}".`,
          temperature: 0.8,
        });
        const readingTime = Math.max(
          1,
          Math.ceil((result.content?.[0]?.length ?? 100) / 500),
        );
        return {
          content: result.content ?? [],
          hashtags: result.hashtags ?? [],
          readingTime,
        };
      } catch (error: any) {
        this.logger.warn(`LLM generateContent failed: ${error.message}, using fallback`);
      }
    }
    return this.generateContentFallback(params);
  }

  /**
   * Generate hashtag suggestions.
   */
  async generateHashtags(topic: string, keywords?: string[]): Promise<string[]> {
    if (this.openRouter.isAvailable) {
      try {
        const result = await this.openRouter.structuredCompletion<{ hashtags: string[] }>({
          systemPrompt:
            `Generate 10 relevant, trending hashtags for a social media post about "${topic}".
${keywords?.length ? `Focus on these themes: ${keywords.join(', ')}` : ''}
Return valid JSON ONLY: { "hashtags": ["#tag1", "#tag2", ...] }
Tags should be popular but specific — avoid generic overused tags.`,
          userPrompt: `Generate hashtags about: ${topic}`,
          temperature: 0.6,
        });
        return result.hashtags?.slice(0, 10) ?? [];
      } catch (error: any) {
        this.logger.warn(`LLM generateHashtags failed: ${error.message}, using fallback`);
      }
    }
    return this.generateHashtagsFallback(topic, keywords);
  }

  /**
   * Optimize existing content for engagement.
   */
  async optimizeContent(content: string): Promise<{
    optimized: string;
    suggestions: string[];
    readabilityScore: number;
  }> {
    if (this.openRouter.isAvailable) {
      try {
        const result = await this.openRouter.structuredCompletion<{
          optimized: string;
          suggestions: string[];
          readabilityScore: number;
        }>({
          systemPrompt:
            `You are a social media engagement expert. Rewrite the following content to maximize engagement.
Analyze it for: word count, call-to-action presence, emoji usage, and readability.
Return valid JSON ONLY: { "optimized": "rewritten content", "suggestions": ["tip1", "tip2", ...], "readabilityScore": 0-100 }`,
          userPrompt: `Optimize this content for engagement:\n\n${content}`,
          temperature: 0.5,
        });
        return result;
      } catch (error: any) {
        this.logger.warn(`LLM optimizeContent failed: ${error.message}, using fallback`);
      }
    }
    return this.optimizeContentFallback(content);
  }

  /**
   * Analyze content sentiment and suggest improvements.
   */
  async analyzeContent(content: string): Promise<{
    wordCount: number;
    sentenceCount: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    keywords: string[];
    readability: string;
  }> {
    if (this.openRouter.isAvailable) {
      try {
        const result = await this.openRouter.structuredCompletion<{
          sentiment: 'positive' | 'neutral' | 'negative';
          confidence: number;
          keywords: string[];
          readability: 'easy' | 'moderate' | 'complex';
          wordCount: number;
          sentenceCount: number;
        }>({
          systemPrompt:
            `Analyze the sentiment, keywords, and readability of the following text.
Return valid JSON ONLY: { "sentiment": "positive|neutral|negative", "confidence": 0-1, "keywords": ["word1", "word2", ...], "readability": "easy|moderate|complex", "wordCount": number, "sentenceCount": number }`,
          userPrompt: `Analyze this content:\n\n${content}`,
          temperature: 0.3,
        });
        return result;
      } catch (error: any) {
        this.logger.warn(`LLM analyzeContent failed: ${error.message}, using fallback`);
      }
    }
    return this.analyzeContentFallback(content);
  }

  /**
   * Generate caption suggestions for media.
   */
  async generateCaption(
    mediaType: 'image' | 'video' | 'audio',
    keywords?: string[],
  ): Promise<string[]> {
    if (this.openRouter.isAvailable) {
      try {
        const result = await this.openRouter.structuredCompletion<{ captions: string[] }>({
          systemPrompt:
            `You are a creative social media caption writer. Generate 5 engaging captions for a ${mediaType} post.
${keywords?.length ? `Theme/keywords: ${keywords.join(', ')}` : ''}
Make each caption unique in style — some short & punchy, some storytelling, some question-based.
Return valid JSON ONLY: { "captions": ["caption1", "caption2", "caption3", "caption4", "caption5"] }`,
          userPrompt: `Write 5 captions for a ${mediaType} post${keywords?.length ? ` about ${keywords.join(', ')}` : ''}.`,
          temperature: 0.8,
        });
        return result.captions?.slice(0, 5) ?? [];
      } catch (error: any) {
        this.logger.warn(`LLM generateCaption failed: ${error.message}, using fallback`);
      }
    }
    return this.generateCaptionFallback(mediaType, keywords);
  }

  /**
   * Suggest ideal posting time based on content type.
   *
   * This method stays template-based since the LLM cannot know real
   * platform engagement data. In production this would query the
   * analytics module for time-series engagement data.
   */
  suggestBestTime(contentType: 'post' | 'reel' | 'story' | 'article'): {
    time: string;
    day: string;
    reason: string;
  } {
    const suggestions: Record<
      string,
      Array<{ time: string; day: string; reason: string }>
    > = {
      post: [
        { time: '7:00 AM', day: 'weekdays', reason: 'Morning commute engagement spike' },
        { time: '12:00 PM', day: 'weekdays', reason: 'Lunch break scrolling' },
        { time: '6:00 PM', day: 'any', reason: 'After-hours peak engagement' },
      ],
      reel: [
        { time: '8:00 PM', day: 'weekends', reason: 'Weekend entertainment browsing' },
        { time: '2:00 PM', day: 'sunday', reason: 'Sunday afternoon content consumption' },
        { time: '9:00 PM', day: 'any', reason: 'Evening entertainment peak' },
      ],
      story: [
        { time: '8:00 AM', day: 'weekdays', reason: 'Morning story check-in' },
        { time: '6:00 PM', day: 'any', reason: 'End-of-day story catch-up' },
        { time: '10:00 PM', day: 'weekends', reason: 'Late-night story browsing' },
      ],
      article: [
        { time: '10:00 AM', day: 'tuesday', reason: 'Tuesday mid-morning deep reading' },
        { time: '9:00 AM', day: 'thursday', reason: 'Thursday professional development time' },
        { time: '8:00 AM', day: 'weekends', reason: 'Weekend morning long reads' },
      ],
    };

    const options = suggestions[contentType] || suggestions.post;
    return options[Math.floor(Math.random() * options.length)];
  }

  // ── Chat completion (for the AI chatbot widget) ─────────────────────────

  /**
   * Chat completion with Zynkra platform context.
   * Returns an Observable that emits content deltas for SSE streaming.
   */
  chatCompletion(chatDto: ChatDto): Observable<string> {
    const contextSystemPrompt =
      chatDto.systemPrompt ||
      `You are Zynkra's AI assistant. You help users with:
- Customer service questions (account, login, reporting)
- Community management (creating communities, moderation settings)
- Content creation tips
- Technical support

Be helpful, concise, and friendly. If you don't know something, say so honestly.
For issues requiring human intervention, direct them to the support team.

Zynkra is a social platform with features including: posts, stories, reels, messaging,
groups, events, marketplace, articles, podcasts, courses, newsletters, live streaming,
wallet/payments, tipping, AI content tools, and more.`;

    // Inject system message at the start
    const messages = [
      { role: 'system' as const, content: contextSystemPrompt },
      ...chatDto.messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
    ];

    if (this.openRouter.isAvailable) {
      return this.openRouter.streamingCompletion({ messages, temperature: 0.7 });
    }

    // Fallback: emit a single response string as an Observable
    const fallbackResponse = this.getChatFallback(
      chatDto.messages[chatDto.messages.length - 1]?.content ?? '',
    );
    return new Observable<string>((subscriber) => {
      subscriber.next(fallbackResponse);
      subscriber.complete();
    });
  }

  private getChatFallback(userMessage: string): string {
    const lower = userMessage.toLowerCase();
    if (lower.includes('report') || lower.includes('flag'))
      return 'To report content, click the flag icon on any post. Our moderation team typically reviews reports within 24 hours.';
    if (lower.includes('community') || lower.includes('group'))
      return 'You can create a community by going to the Groups section and clicking "Create Group". You can then customize settings, invite members, and set moderation rules.';
    if (lower.includes('monetize') || lower.includes('earn') || lower.includes('money'))
      return 'Zynkra offers several monetization options: subscriptions, tipping, content boosting, and marketplace sales. Check the Creator Dashboard to get started!';
    if (lower.includes('login') || lower.includes('sign in') || lower.includes('password'))
      return 'If you\'re having trouble logging in, use the "Forgot Password" option on the login page. For persistent issues, you can try clearing your browser cache or using a different browser.';
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey'))
      return '👋 Welcome to Zynkra! I\'m your AI assistant. I can help with account issues, content creation, community management, and more. What can I help you with today?';
    return 'Thanks for your message! I\'ll do my best to help. Could you provide a bit more detail about what you\'re looking for? You can ask me about account settings, creating content, managing communities, or using Zynkra\'s features.';
  }

  // ── Fallback methods (original template logic) ──────────────────────────

  private generateContentFallback(params: {
    topic: string;
    type: string;
    details?: string;
    tone?: string;
  }): { content: string[]; hashtags: string[]; readingTime: number } {
    const type = params.type === 'caption' ? 'announcement' : params.type;
    const templates = (this.templates as any)[type] || this.templates.announcement;
    const details = params.details || 'Details here...';
    const topic = params.topic;

    const contents = templates.map((template: string) => {
      let content = template
        .replace(/{topic}/g, topic)
        .replace(/{details}/g, details)
        .replace(/{step1}/g, 'Start with the basics')
        .replace(/{step2}/g, 'Build on that foundation')
        .replace(/{step3}/g, 'Take it to the next level')
        .replace(/{argument}/g, 'this matters more than people realize');

      if (params.tone === 'casual') {
        content = content.replace(/excited/g, 'stoked').replace(/announce/g, 'share');
      } else if (params.tone === 'humorous') {
        content += '\n\n(Probably.)';
      } else if (params.tone === 'inspirational') {
        content = '\n\n✨ ' + content.replace(/\!/g, '!\n\n');
      }
      return content;
    });

    const hashtags = this.generateHashtagsFallback(topic, []);
    return {
      content: contents,
      hashtags,
      readingTime: Math.max(1, Math.ceil(contents[0].length / 500)),
    };
  }

  private generateHashtagsFallback(topic: string, keywords?: string[]): string[] {
    const wordPool = topic
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    const suggestions = new Set<string>();
    suggestions.add(`#${wordPool[0] || 'topic'}`);
    if (wordPool.length > 1) suggestions.add(`#${wordPool.join('')}`);
    if (keywords) {
      keywords.forEach((kw) => suggestions.add(`#${kw.replace(/[^a-z0-9]/gi, '')}`));
    }
    suggestions.add('#trending');
    suggestions.add('#fyp');
    suggestions.add('#content');
    suggestions.add('#viral');
    return Array.from(suggestions).slice(0, 10);
  }

  private optimizeContentFallback(content: string): {
    optimized: string;
    suggestions: string[];
    readabilityScore: number;
  } {
    const suggestions: string[] = [];
    let optimized = content;
    const wordCount = content.split(/\s+/).length;

    if (wordCount < 50)
      suggestions.push('Add more detail — posts over 50 words get 2x more engagement');
    if (wordCount > 200)
      suggestions.push('Consider breaking this into a thread for better readability');
    if (
      !content.includes('?') &&
      !content.toLowerCase().includes('comment') &&
      !content.toLowerCase().includes('share')
    ) {
      optimized += '\n\nWhat do you think? Share your thoughts below! 👇';
      suggestions.push('Added a call-to-action to boost engagement');
    }
    const emojiRegex = /[\u{1F000}-\u{1FFFF}]/u;
    if (!emojiRegex.test(content)) {
      suggestions.push('Add emojis to increase engagement by up to 47%');
    }
    const sentences = content.split(/[.!?]+/).filter(Boolean);
    const avgSentenceLength = wordCount / Math.max(sentences.length, 1);
    const readabilityScore = Math.max(0, Math.min(100, 100 - (avgSentenceLength - 10) * 5));

    return {
      optimized,
      suggestions,
      readabilityScore: Math.round(readabilityScore),
    };
  }

  private analyzeContentFallback(content: string): {
    wordCount: number;
    sentenceCount: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    keywords: string[];
    readability: string;
  } {
    const words = content.split(/\s+/).filter(Boolean);
    const sentences = content.split(/[.!?]+/).filter(Boolean);
    const positiveWords = [
      'great', 'amazing', 'excellent', 'awesome', 'love', 'wonderful', 'fantastic',
      'good', 'happy', 'beautiful', 'incredible', 'best', 'exciting',
    ];
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'sad',
      'angry', 'disappointing', 'poor', 'boring',
    ];
    const lower = content.toLowerCase();
    const posCount = positiveWords.filter((w) => lower.includes(w)).length;
    const negCount = negativeWords.filter((w) => lower.includes(w)).length;

    let sentiment: 'positive' | 'neutral' | 'negative';
    let confidence: number;
    if (posCount > negCount) {
      sentiment = 'positive';
      confidence = 0.5 + (posCount - negCount) / Math.max(words.length, 1);
    } else if (negCount > posCount) {
      sentiment = 'negative';
      confidence = 0.5 + (negCount - posCount) / Math.max(words.length, 1);
    } else {
      sentiment = 'neutral';
      confidence = 0.3;
    }

    const wordFreq = new Map<string, number>();
    words.forEach((w) => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      if (clean.length > 4) wordFreq.set(clean, (wordFreq.get(clean) || 0) + 1);
    });
    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const readability =
      avgWordsPerSentence > 20 ? 'complex' : avgWordsPerSentence > 12 ? 'moderate' : 'easy';

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      sentiment,
      confidence: Math.min(confidence, 1),
      keywords,
      readability,
    };
  }

  private generateCaptionFallback(
    mediaType: 'image' | 'video' | 'audio',
    keywords?: string[],
  ): string[] {
    const captions: Record<string, string[]> = {
      image: [
        'A moment worth capturing 📸',
        "Just a glimpse of what's to come... ✨",
        'Picture perfect! 🎯',
        'This one hits different. 💫',
        'Moments like these. 🫶',
      ],
      video: [
        'Watch till the end! 🎬',
        "You won't believe what happens next... ⏩",
        'Had to share this moment. 🎥',
        'Full video is even better! 🔥',
        'A quick look at something special. 👀',
      ],
      audio: [
        'Turn up the volume! 🔊',
        'Listen to this 🎧',
        'Sound on! 🎵',
        "This one's for the ears. 🎶",
        'Close your eyes and listen. 🎧',
      ],
    };

    const suggestions = captions[mediaType] || captions.image;
    return suggestions.map((caption) => {
      if (keywords && keywords.length > 0) {
        return `${caption}\n\n${keywords.slice(0, 3).map((k) => `#${k}`).join(' ')}`;
      }
      return caption;
    });
  }
}
