import { SentimentService, SentimentType } from './sentiment.service';

describe('SentimentService', () => {
  let service: SentimentService;

  beforeEach(() => {
    service = new SentimentService();
  });

  describe('analyzeSentiment classification', () => {
    it('classifies strongly positive text', async () => {
      const result = await service.analyzeSentiment('I love this, it is perfect and incredible');
      expect(result.sentiment).toBe(SentimentType.POSITIVE);
      expect(result.score).toBeGreaterThan(0.15);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('classifies strongly negative text', async () => {
      const result = await service.analyzeSentiment('I hate this, it is terrible and awful');
      expect(result.sentiment).toBe(SentimentType.NEGATIVE);
      expect(result.score).toBeLessThan(-0.15);
    });

    it('treats text with no sentiment words as neutral with baseline confidence', async () => {
      const result = await service.analyzeSentiment('the table is wooden');
      expect(result.sentiment).toBe(SentimentType.NEUTRAL);
      expect(result.score).toBe(0);
      expect(result.confidence).toBe(0.3);
    });

    it('clamps the score into [-1, 1] even under heavy repetition', async () => {
      const result = await service.analyzeSentiment(
        'love love love love love love love love love love love love'
      );
      expect(result.score).toBeGreaterThanOrEqual(-1);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  describe('negation and amplification', () => {
    it('flips a positive word under negation', async () => {
      const plain = await service.analyzeSentiment('good');
      const negated = await service.analyzeSentiment('not good');
      expect(negated.score).toBeLessThan(0);
      expect(negated.sentiment).toBe(SentimentType.NEGATIVE);
      expect(Math.abs(negated.score)).toBeLessThan(Math.abs(plain.score) + 1);
    });

    it('limits negation scope to the next sentiment word', async () => {
      // 'not' attaches to the first sentiment word; the second stays positive
      const result = await service.analyzeSentiment('not bad, actually great');
      expect(result.score).toBeGreaterThan(0);
      expect(result.sentiment).toBe(SentimentType.POSITIVE);
    });

    it('an amplifier raises the magnitude versus the bare word', async () => {
      const plain = await service.analyzeSentiment('good');
      const amplified = await service.analyzeSentiment('extremely good');
      expect(amplified.score).toBeGreaterThan(plain.score);
    });
  });

  describe('sarcasm detection', () => {
    it('flips sarcastic positive phrasing to negative', async () => {
      const sincere = await service.analyzeSentiment('oh great');
      const sarcastic = await service.analyzeSentiment('oh great /s');
      expect(sarcastic.sentiment).toBe(SentimentType.NEGATIVE);
      expect(sincere.sentiment).not.toBe(SentimentType.NEGATIVE);
    });

    it('flags alternating caps as a sarcasm indicator', async () => {
      const result = await service.analyzeSentiment('weLl tHaT wAs FuN /s');
      expect(result.confidence).toBeGreaterThan(0.3);
    });
  });

  describe('multi-word phrases', () => {
    it('scores "can\'t wait" as a positive phrase even without lexicon words', async () => {
      const result = await service.analyzeSentiment("I can't wait for tomorrow");
      expect(result.sentiment).toBe(SentimentType.POSITIVE);
      expect(result.score).toBeGreaterThan(0.15);
    });

    it('scores negative phrases like "waste of time"', async () => {
      const result = await service.analyzeSentiment('this meeting was a total waste of time');
      expect(result.score).toBeLessThan(0);
    });
  });

  describe('emotion detection', () => {
    it('extracts joy from happy wording', async () => {
      const result = await service.analyzeSentiment('I am so happy and joyful today');
      expect(result.emotions?.joy).toBeDefined();
      expect(result.emotions!.joy!).toBeGreaterThan(0);
    });

    it('extracts anger and sadness from their word groups', async () => {
      const result = await service.analyzeSentiment(
        'I am furious and heartbroken about this disaster'
      );
      expect(result.emotions?.anger).toBeDefined();
      expect(result.emotions?.sadness).toBeDefined();
    });

    it('marks short exclamations as mild surprise when no emotion words match', async () => {
      const result = await service.analyzeSentiment('hey!!!');
      expect(result.emotions?.surprise).toBe(0.3);
    });
  });
});
