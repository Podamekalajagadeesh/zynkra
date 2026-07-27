/**
 * On-Device LLM Service
 *
 * Uses WebLLM (https://webllm.mlc.ai/) to run a small language model locally
 * in the user's browser via WebGPU. No data ever leaves the device.
 *
 * This is the key privacy advantage over Meta AI, X Grok, Snapchat MyAI —
 * our AI never sees your data because it runs on YOUR device.
 *
 * Requirements: browser with WebGPU support (Chrome 113+).
 * The model (~1GB) is downloaded and cached on first use.
 *
 * Capabilities:
 * - Chat/conversation
 * - Content generation
 * - Text summarization
 * - Sentiment analysis
 * - Translation
 * - Content suggestions
 * - Caption and hashtag generation
 */

interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  text: string;
  tokensUsed: number;
  model: string;
}

const DEFAULT_CONFIG: LLMConfig = {
  model: 'TinyLlama-1.1B-Chat-v1.0',
  temperature: 0.7,
  maxTokens: 512,
  topP: 0.9,
};

const SYSTEM_PROMPT = `You are Zynkra AI, a helpful assistant that runs entirely on the user's device.
You can help with:
- Writing and editing social media posts
- Generating content ideas
- Summarizing text
- Analyzing sentiment
- Suggesting hashtags
- Answering questions about the Zynkra platform

You are privacy-focused — you never send data to external servers.
Keep responses concise and helpful.`;

class OnDeviceLLMService {
  private engine: any = null;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private config: LLMConfig = DEFAULT_CONFIG;

  /**
   * Initialize the LLM engine.
   * This downloads the model on first use (~1GB) and caches it.
   */
  async initialize(): Promise<void> {
    if (this.isLoaded || this.isLoading) return;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.loadPromise = this._loadModel();
    await this.loadPromise;
  }

  private async _loadModel(): Promise<void> {
    try {
      // Dynamically import WebLLM
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

      this.engine = await CreateMLCEngine(this.config.model, {
        logLevel: 'INFO',
      });

      this.isLoaded = true;
      this.isLoading = false;
      console.log('On-device LLM loaded successfully:', this.config.model);
    } catch (error) {
      this.isLoading = false;
      this.loadPromise = null;
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Failed to load on-device LLM:', msg);
      if (msg.includes("@mlc-ai/web-llm") || msg.includes("Failed to resolve module")) {
        throw new Error(
          'On-device LLM is not available yet. The @mlc-ai/web-llm dependency is not installed. ' +
          'This feature is in Preview — see the roadmap for status updates.'
        );
      }
      throw error;
    }
  }

  /**
   * Chat with the on-device LLM.
   */
  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    if (!this.engine) {
      throw new Error('LLM engine not available');
    }

    try {
      const response = await this.engine.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        top_p: this.config.topP,
      });

      return {
        text: response.choices[0]?.message?.content || '',
        tokensUsed: response.usage?.total_tokens || 0,
        model: this.config.model,
      };
    } catch (error) {
      console.error('LLM chat error:', error);
      throw error;
    }
  }

  /**
   * Generate a social media post from a topic.
   */
  async generatePost(topic: string, tone: string = 'casual'): Promise<LLMResponse> {
    const prompt = `Write a social media post about: ${topic}
Tone: ${tone}
Make it engaging and include relevant emojis.
Keep it under 280 characters for optimal engagement.
Return ONLY the post text, nothing else.`;

    return this.chat([{ role: 'user', content: prompt }]);
  }

  /**
   * Generate article content.
   */
  async generateArticle(title: string, outline?: string): Promise<LLMResponse> {
    const prompt = `Write a comprehensive article about: ${title}
${outline ? `Outline: ${outline}` : ''}

Structure the article with:
1. Engaging introduction
2. Main points with subheadings
3. Practical examples
4. Conclusion with call to action

Write in a professional but approachable tone.
Aim for 1000-1500 words.`;

    return this.chat([{ role: 'user', content: prompt }]);
  }

  /**
   * Generate hashtags for content.
   */
  async generateHashtags(content: string): Promise<LLMResponse> {
    const prompt = `Generate 10-15 relevant hashtags for this content:

"${content}"

Return ONLY the hashtags, one per line, starting with #.
Make them a mix of popular and niche tags.
Format: #hashtag1 #hashtag2 #hashtag3...`;

    return this.chat([{ role: 'user', content: prompt }]);
  }

  /**
   * Summarize text.
   */
  async summarize(text: string): Promise<LLMResponse> {
    const prompt = `Summarize the following text in 2-3 sentences:

"${text}"

Be concise and capture the key points.`;

    return this.chat([{ role: 'user', content: prompt }]);
  }

  /**
   * Analyze sentiment of text.
   */
  async analyzeSentiment(text: string): Promise<LLMResponse> {
    const prompt = `Analyze the sentiment of this text and return a JSON object:

"${text}"

Return format: {"sentiment": "positive/negative/neutral", "confidence": 0.0-1.0, "keywords": ["word1", "word2"]}`;

    return this.chat([{ role: 'user', content: prompt }]);
  }

  /**
   * Translate text.
   */
  async translate(text: string, targetLanguage: string): Promise<LLMResponse> {
    const prompt = `Translate the following text to ${targetLanguage}:

"${text}"

Return ONLY the translated text, nothing else.`;

    return this.chat([{ role: 'user', content: prompt }]);
  }

  /**
   * Generate captions for media.
   */
  async generateCaption(mediaType: string, description?: string): Promise<LLMResponse> {
    const prompt = `Generate 5 engaging captions for a ${mediaType} post.
${description ? `Context: ${description}` : ''}

Make them catchy, include emojis, and vary in style.
Return one caption per line.`;

    return this.chat([{ role: 'user', content: prompt }]);
  }

  /**
   * Get model status.
   */
  getStatus(): { loaded: boolean; loading: boolean; model: string } {
    return {
      loaded: this.isLoaded,
      loading: this.isLoading,
      model: this.config.model,
    };
  }

  /**
   * Change the model (requires reload).
   */
  setModel(model: string): void {
    this.config.model = model;
    this.isLoaded = false;
    this.engine = null;
  }
}

// Singleton instance
let _instance: OnDeviceLLMService | null = null;

export function getOnDeviceLLM(): OnDeviceLLMService {
  if (!_instance) {
    _instance = new OnDeviceLLMService();
  }
  return _instance;
}

export type { ChatMessage, LLMResponse, LLMConfig };
