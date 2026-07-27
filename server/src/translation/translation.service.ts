import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Real-time translation service for DMs, posts, and articles.
 * Uses multiple translation providers with automatic fallback.
 */
@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly deeplApiKey: string | undefined;
  private readonly libreUrl: string | undefined;
  private readonly translationCache: Map<string, string> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.deeplApiKey = this.configService.get<string>('DEEPL_API_KEY');
    this.libreUrl = this.configService.get<string>('LIBRETRANSLATE_URL', 'https://libretranslate.com');
  }

  /**
   * Supported language codes (ISO 639-1).
   */
  getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'nl', name: 'Dutch' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'tr', name: 'Turkish' },
      { code: 'pl', name: 'Polish' },
      { code: 'sv', name: 'Swedish' },
      { code: 'da', name: 'Danish' },
      { code: 'fi', name: 'Finnish' },
      { code: 'no', name: 'Norwegian' },
      { code: 'uk', name: 'Ukrainian' },
      { code: 'cs', name: 'Czech' },
      { code: 'el', name: 'Greek' },
      { code: 'he', name: 'Hebrew' },
      { code: 'th', name: 'Thai' },
      { code: 'vi', name: 'Vietnamese' },
      { code: 'id', name: 'Indonesian' },
    ];
  }

  /**
   * Translate text from source language to target language.
   * Uses cache to avoid re-translating the same text.
   */
  async translate(
    text: string,
    sourceLang: string = 'auto',
    targetLang: string = 'en',
  ): Promise<{ translatedText: string; detectedLanguage?: string; provider: string }> {
    if (!text || text.trim().length === 0) {
      return { translatedText: text, provider: 'none' };
    }

    // Check cache
    const cacheKey = `${text}:${sourceLang}:${targetLang}`;
    const cached = this.translationCache.get(cacheKey);
    if (cached) {
      return { translatedText: cached, provider: 'cache' };
    }

    // Try DeepL first (higher quality)
    if (this.deeplApiKey) {
      try {
        const result = await this.translateWithDeepL(text, sourceLang, targetLang);
        this.translationCache.set(cacheKey, result.translatedText);
        return result;
      } catch (error) {
        this.logger.warn('DeepL translation failed, trying fallback:', error);
      }
    }

    // Fallback to LibreTranslate
    try {
      const result = await this.translateWithLibre(text, sourceLang, targetLang);
      this.translationCache.set(cacheKey, result.translatedText);
      return result;
    } catch (error) {
      this.logger.error('All translation providers failed:', error);
      return { translatedText: text, provider: 'original' };
    }
  }

  /**
   * Batch translate multiple texts in one request.
   */
  async translateBatch(
    texts: string[],
    sourceLang: string = 'auto',
    targetLang: string = 'en',
  ): Promise<{ translatedTexts: string[]; provider: string }> {
    // DeepL supports batch natively
    if (this.deeplApiKey) {
      try {
        const translatedTexts = await this.batchDeepL(texts, sourceLang, targetLang);
        return { translatedTexts, provider: 'deepl' };
      } catch (error) {
        this.logger.warn('DeepL batch failed, falling back to individual:', error);
      }
    }

    // Translate individually as fallback
    const results = await Promise.all(
      texts.map((text) => this.translate(text, sourceLang, targetLang)),
    );
    return {
      translatedTexts: results.map((r) => r.translatedText),
      provider: 'libre',
    };
  }

  /**
   * Detect the language of a text.
   */
  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    // Use DeepL if available
    if (this.deeplApiKey) {
      try {
        const response = await axios.post(
          'https://api-free.deepl.com/v2/translate',
          { text: [text.slice(0, 1000)], source_lang: 'auto' },
          {
            headers: { Authorization: `DeepL-Auth-Key ${this.deeplApiKey}` },
            params: { auth_key: this.deeplApiKey, text: text.slice(0, 1000), source_lang: 'AUTO' },
          },
        );
        return {
          language: response.data.translations?.[0]?.detected_source_language || 'unknown',
          confidence: 0.9,
        };
      } catch {
        // fallback
      }
    }

    // Simple heuristic fallback
    const detected = this.heuristicDetect(text);
    return detected;
  }

  private async translateWithDeepL(
    text: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<{ translatedText: string; detectedLanguage?: string; provider: string }> {
    const params: Record<string, string> = {
      text,
      target_lang: targetLang.toUpperCase(),
    };
    if (sourceLang !== 'auto') {
      params.source_lang = sourceLang.toUpperCase();
    }

    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      null,
      {
        headers: { Authorization: `DeepL-Auth-Key ${this.deeplApiKey}` },
        params,
      },
    );

    return {
      translatedText: response.data.translations[0].text,
      detectedLanguage: response.data.translations[0].detected_source_language,
      provider: 'deepl',
    };
  }

  private async translateWithLibre(
    text: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<{ translatedText: string; provider: string }> {
    const response = await axios.post(`${this.libreUrl}/translate`, {
      q: text,
      source: sourceLang === 'auto' ? 'auto' : sourceLang,
      target: targetLang,
      format: 'text',
    });

    return {
      translatedText: response.data.translatedText,
      provider: 'libre',
    };
  }

  private async batchDeepL(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      { text: texts, source_lang: sourceLang.toUpperCase(), target_lang: targetLang.toUpperCase() },
      { headers: { Authorization: `DeepL-Auth-Key ${this.deeplApiKey}` } },
    );

    return response.data.translations.map((t: any) => t.text);
  }

  private heuristicDetect(text: string): { language: string; confidence: number } {
    const sample = text.slice(0, 200);
    if (/[぀-ゟ゠-ヿ]/.test(sample)) return { language: 'ja', confidence: 0.7 };
    if (/[가-힯]/.test(sample)) return { language: 'ko', confidence: 0.7 };
    if (/[一-鿿]/.test(sample)) return { language: 'zh', confidence: 0.6 };
    if (/[؀-ۿ]/.test(sample)) return { language: 'ar', confidence: 0.6 };
    if (/[Ѐ-ӿ]/.test(sample)) return { language: 'ru', confidence: 0.6 };
    if (/\b(the|is|are|was|were|have|has|been)\b/i.test(sample)) return { language: 'en', confidence: 0.5 };
    if (/\b(el|la|los|las|es|son|está)\b/i.test(sample)) return { language: 'es', confidence: 0.5 };
    if (/\b(le|la|les|des|est|sont|été)\b/i.test(sample)) return { language: 'fr', confidence: 0.5 };
    if (/\b(der|die|das|ist|sind|hat|haben)\b/i.test(sample)) return { language: 'de', confidence: 0.5 };
    return { language: 'en', confidence: 0.3 };
  }
}
