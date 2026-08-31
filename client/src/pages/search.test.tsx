import { describe, it, expect, vi, afterEach } from 'vitest';
import { getSpeechRecognitionConstructor } from './search';

describe('Voice Search support', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the native SpeechRecognition constructor when available', () => {
    const recognition = vi.fn();
    vi.stubGlobal('SpeechRecognition', recognition);

    expect(getSpeechRecognitionConstructor()).toBe(recognition);
  });

  it('returns no constructor when voice search is unsupported', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);

    expect(getSpeechRecognitionConstructor()).toBeUndefined();
  });
});