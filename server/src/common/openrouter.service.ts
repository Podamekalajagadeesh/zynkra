import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable, map } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

/**
 * Shared wrapper around the OpenRouter API (OpenAI-compatible).
 *
 * All AI-consuming services (AiContentService, ModerationService,
 * DeepfakeDetectionService, BiasDetectionService) inject this service
 * instead of calling the LLM directly.
 *
 * Every public method returns immediately with template/fallback data when
 * `isAvailable` is false, so the platform keeps working without an API key.
 */
@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly textModel: string;
  private readonly visionModel: string;
  private readonly analysisModel: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    this.baseUrl = this.configService.get<string>(
      'OPENROUTER_BASE_URL',
      'https://openrouter.ai/api/v1',
    );
    this.textModel = this.configService.get<string>('AI_TEXT_MODEL', 'openai/gpt-4o-mini');
    this.visionModel = this.configService.get<string>('AI_VISION_MODEL', 'openai/gpt-4o');
    this.analysisModel = this.configService.get<string>(
      'AI_ANALYSIS_MODEL',
      'openai/gpt-4o-mini',
    );
  }

  /** True when an API key is configured and AI features can call the LLM. */
  get isAvailable(): boolean {
    return !!this.apiKey;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Non-streaming chat completion. Returns the assistant's response text.
   */
  async chatCompletion(params: {
    model?: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' };
  }): Promise<{ content: string; usage?: any }> {
    const body: Record<string, any> = {
      model: params.model || this.textModel,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2048,
      stream: false,
    };
    if (params.responseFormat) {
      body.response_format = params.responseFormat;
    }

    const response = await this.post(body);
    const choice = response.data?.choices?.[0];
    return {
      content: choice?.message?.content ?? '',
      usage: response.data?.usage,
    };
  }

  /**
   * Structured JSON completion. Wraps `chatCompletion` with
   * `response_format: { type: 'json_object' }` and parses the response.
   */
  async structuredCompletion<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    temperature?: number;
  }): Promise<T> {
    const { content } = await this.chatCompletion({
      model: params.model || this.textModel,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.7,
      maxTokens: 4096,
      responseFormat: { type: 'json_object' },
    });
    return JSON.parse(content) as T;
  }

  /**
   * Vision analysis. Sends an image URL (or base64 data-URI) alongside a text
   * prompt to a vision-capable model.
   */
  async visionAnalysis(params: {
    imageUrl: string;
    prompt: string;
    model?: string;
    maxTokens?: number;
  }): Promise<{ content: string }> {
    const body = {
      model: params.model || this.visionModel,
      messages: [
        {
          role: 'user' as const,
          content: [
            { type: 'text', text: params.prompt },
            {
              type: 'image_url',
              image_url: { url: params.imageUrl },
            },
          ],
        },
      ],
      max_tokens: params.maxTokens ?? 1024,
      stream: false,
    };

    const response = await this.post(body);
    const choice = response.data?.choices?.[0];
    return {
      content: choice?.message?.content ?? '',
    };
  }

  /**
   * Streaming chat completion. Returns an Observable that emits each content
   * delta as a string, suitable for SSE consumption.
   */
  streamingCompletion(params: {
    model?: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
  }): Observable<string> {
    const body: Record<string, any> = {
      model: params.model || this.textModel,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: 2048,
      stream: true,
    };

    // Axios request config with streaming responseType
    const config: AxiosRequestConfig = {
      headers: this.buildHeaders(),
      responseType: 'stream',
      timeout: 60_000,
    };

    return this.httpService.post(`${this.baseUrl}/chat/completions`, body, config).pipe(
      map((response) => response.data),
      // The caller gets the raw stream and reads SSE chunks from it.
    );
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://zynkra.app',
      'X-Title': 'Zynkra',
    };
  }

  private async post(body: Record<string, any>): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/chat/completions`, body, {
          headers: this.buildHeaders(),
          timeout: 30_000,
        }),
      );
      return response;
    } catch (error: any) {
      // Surface enough context for the caller's fallback to decide
      const status = error?.response?.status;
      const message = error?.response?.data?.error?.message || error.message;
      this.logger.warn(`OpenRouter API error (${status}): ${message}`);
      throw new Error(`OpenRouter API error: ${message}`);
    }
  }
}
