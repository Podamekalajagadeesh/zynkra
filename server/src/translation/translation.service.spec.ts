import axios from 'axios';
import { TranslationService } from './translation.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TranslationService', () => {
  function makeService(env: Record<string, unknown> = {}) {
    const config = {
      get: (key: string, fallback?: unknown) => (key in env ? env[key] : fallback),
    };
    return new TranslationService(config as never);
  }

  function deeplResponse(text: string, detected = 'EN') {
    return { data: { translations: [{ text, detected_source_language: detected }] } };
  }

  beforeEach(() => {
    mockedAxios.post = jest.fn();
  });

  describe('translate provider fallback chain', () => {
    it('returns empty input untouched without calling any provider', async () => {
      const service = makeService({ DEEPL_API_KEY: 'k' });
      await expect(service.translate('   ')).resolves.toEqual({
        translatedText: '   ',
        provider: 'none',
      });
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('uses DeepL when the key is configured and caches the result', async () => {
      mockedAxios.post.mockResolvedValueOnce(deeplResponse('hola'));
      const service = makeService({ DEEPL_API_KEY: 'k' });

      const first = await service.translate('hello', 'en', 'es');
      expect(first).toEqual({
        translatedText: 'hola',
        detectedLanguage: 'EN',
        provider: 'deepl',
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api-free.deepl.com/v2/translate',
        null,
        expect.objectContaining({
          params: expect.objectContaining({ text: 'hello', target_lang: 'ES', source_lang: 'EN' }),
        })
      );

      const second = await service.translate('hello', 'en', 'es');
      expect(second).toEqual({ translatedText: 'hola', provider: 'cache' });
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('omits source_lang when the caller asks for auto-detection', async () => {
      mockedAxios.post.mockResolvedValueOnce(deeplResponse('hola', 'EN'));
      const service = makeService({ DEEPL_API_KEY: 'k' });

      await service.translate('hello', 'auto', 'es');
      const config = mockedAxios.post.mock.calls[0][2] as { params: Record<string, string> };
      expect(config.params.source_lang).toBeUndefined();
    });

    it('falls back to LibreTranslate when DeepL fails', async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error('deepl down'))
        .mockResolvedValueOnce({ data: { translatedText: 'hola' } });
      const service = makeService({ DEEPL_API_KEY: 'k' });

      const result = await service.translate('hello', 'en', 'es');
      expect(result).toEqual({ translatedText: 'hola', provider: 'libre' });
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        'https://libretranslate.com/translate',
        expect.objectContaining({ q: 'hello', source: 'en', target: 'es', format: 'text' })
      );
    });

    it('uses Libre directly when no DeepL key is set', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { translatedText: 'bonjour' } });
      const service = makeService({});

      const result = await service.translate('hello', 'auto', 'fr');
      expect(result.provider).toBe('libre');
      expect(mockedAxios.post.mock.calls[0][1]).toMatchObject({ source: 'auto' });
    });

    it('returns the original text when every provider fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('all down'));
      const service = makeService({ DEEPL_API_KEY: 'k' });

      await expect(service.translate('hello', 'en', 'es')).resolves.toEqual({
        translatedText: 'hello',
        provider: 'original',
      });
    });
  });

  describe('LRU cache', () => {
    it('evicts the least recently used entry at capacity', async () => {
      mockedAxios.post.mockImplementation(async (_url: string, _body: unknown, cfg: never) => {
        const text = (cfg as { params: { text: string } }).params.text;
        return deeplResponse(`t-${text}`);
      });
      const service = makeService({ DEEPL_API_KEY: 'k', TRANSLATION_CACHE_MAX_ENTRIES: 2 });

      await service.translate('one', 'en', 'es');
      await service.translate('two', 'en', 'es');
      await service.translate('three', 'en', 'es');

      expect(service.getCacheSize()).toBe(2);
      // 'one' was evicted → a repeat hits the network again
      await service.translate('one', 'en', 'es');
      expect(service.getCacheSize()).toBe(2);
      expect(mockedAxios.post).toHaveBeenCalledTimes(4);
    });

    it('a cache hit refreshes recency so the other entry is the one evicted', async () => {
      mockedAxios.post.mockImplementation(async (_url: string, _body: unknown, cfg: never) => {
        const text = (cfg as { params: { text: string } }).params.text;
        return deeplResponse(`t-${text}`);
      });
      const service = makeService({ DEEPL_API_KEY: 'k', TRANSLATION_CACHE_MAX_ENTRIES: 2 });

      await service.translate('one', 'en', 'es');
      await service.translate('two', 'en', 'es');
      await service.translate('one', 'en', 'es'); // hit → 'two' is now oldest
      await service.translate('three', 'en', 'es');

      expect(service.getCacheSize()).toBe(2);
      // 'one' survived the eviction and still serves from cache
      await expect(service.translate('one', 'en', 'es')).resolves.toMatchObject({
        provider: 'cache',
      });
    });
  });

  describe('translateBatch', () => {
    it('uses DeepL batch natively when the key is set', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { translations: [{ text: 'hola' }, { text: 'adios' }] },
      });
      const service = makeService({ DEEPL_API_KEY: 'k' });

      const result = await service.translateBatch(['hello', 'bye'], 'en', 'es');
      expect(result).toEqual({ translatedTexts: ['hola', 'adios'], provider: 'deepl' });
      expect(mockedAxios.post.mock.calls[0][1]).toMatchObject({ text: ['hello', 'bye'] });
    });

    it('falls back to individual translations when batch DeepL fails', async () => {
      mockedAxios.post.mockImplementation(async (url: string) => {
        if (url.includes('deepl')) throw new Error('batch unsupported');
        return { data: { translatedText: 'x' } };
      });
      const service = makeService({ DEEPL_API_KEY: 'k' });

      const result = await service.translateBatch(['hello', 'bye'], 'en', 'es');
      expect(result.provider).toBe('libre');
      expect(result.translatedTexts).toEqual(['x', 'x']);
    });
  });

  describe('detectLanguage', () => {
    it('asks DeepL for detection when the key is set', async () => {
      mockedAxios.post.mockResolvedValueOnce(deeplResponse('ignored', 'JA'));
      const service = makeService({ DEEPL_API_KEY: 'k' });

      await expect(service.detectLanguage('anything')).resolves.toEqual({
        language: 'JA',
        confidence: 0.9,
      });
    });

    it.each([
      ['こんにちは世界', 'ja'],
      ['안녕하세요 세계', 'ko'],
      ['你好世界', 'zh'],
      ['مرحبا بالعالم', 'ar'],
      ['Привет мир', 'ru'],
      ['the cat is on the mat', 'en'],
      ['el gato está en la casa', 'es'],
      ['le chat est sur une table', 'fr'],
      ['der Hund ist im Haus', 'de'],
      ['mystery language xqz', 'en'],
    ])('heuristically detects %s as %s', async (text, expected) => {
      const service = makeService({});
      const result = await service.detectLanguage(text);
      expect(result.language).toBe(expected);
    });

    it('falls back to the heuristic when DeepL detection throws', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('nope'));
      const service = makeService({ DEEPL_API_KEY: 'k' });

      const result = await service.detectLanguage('the dog barks');
      expect(result.language).toBe('en');
    });
  });

  describe('getSupportedLanguages', () => {
    it('advertises the core European and Asian set', () => {
      const codes = makeService({})
        .getSupportedLanguages()
        .map((l) => l.code);
      expect(codes).toEqual(
        expect.arrayContaining(['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'ar', 'hi'])
      );
    });
  });
});
