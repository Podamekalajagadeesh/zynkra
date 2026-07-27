/**
 * useOnDeviceLLM — React hook for the on-device AI assistant.
 *
 * Provides access to the private, browser-based LLM that never
 * sends data to external servers.
 */
import { useState, useCallback, useRef } from 'react';
import { getOnDeviceLLM, type ChatMessage, type LLMResponse } from '../services/llm.service';

interface UseOnDeviceLLMReturn {
  isReady: boolean;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  chat: (messages: ChatMessage[]) => Promise<LLMResponse>;
  generatePost: (topic: string, tone?: string) => Promise<LLMResponse>;
  generateArticle: (title: string, outline?: string) => Promise<LLMResponse>;
  generateHashtags: (content: string) => Promise<LLMResponse>;
  summarize: (text: string) => Promise<LLMResponse>;
  analyzeSentiment: (text: string) => Promise<LLMResponse>;
  translate: (text: string, targetLang: string) => Promise<LLMResponse>;
  generateCaption: (mediaType: string, description?: string) => Promise<LLMResponse>;
  getStatus: () => { loaded: boolean; loading: boolean; model: string };
}

export function useOnDeviceLLM(): UseOnDeviceLLMReturn {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const llmRef = useRef(getOnDeviceLLM());

  const initialize = useCallback(async () => {
    if (isReady || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await llmRef.current.initialize();
      setIsReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI model');
    } finally {
      setIsLoading(false);
    }
  }, [isReady, isLoading]);

  const withGeneration = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    if (!isReady) {
      await initialize();
    }
    setIsGenerating(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI generation failed';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [isReady, initialize]);

  const chat = useCallback((messages: ChatMessage[]) => {
    return withGeneration(() => llmRef.current.chat(messages));
  }, [withGeneration]);

  const generatePost = useCallback((topic: string, tone?: string) => {
    return withGeneration(() => llmRef.current.generatePost(topic, tone));
  }, [withGeneration]);

  const generateArticle = useCallback((title: string, outline?: string) => {
    return withGeneration(() => llmRef.current.generateArticle(title, outline));
  }, [withGeneration]);

  const generateHashtags = useCallback((content: string) => {
    return withGeneration(() => llmRef.current.generateHashtags(content));
  }, [withGeneration]);

  const summarize = useCallback((text: string) => {
    return withGeneration(() => llmRef.current.summarize(text));
  }, [withGeneration]);

  const analyzeSentiment = useCallback((text: string) => {
    return withGeneration(() => llmRef.current.analyzeSentiment(text));
  }, [withGeneration]);

  const translate = useCallback((text: string, targetLang: string) => {
    return withGeneration(() => llmRef.current.translate(text, targetLang));
  }, [withGeneration]);

  const generateCaption = useCallback((mediaType: string, description?: string) => {
    return withGeneration(() => llmRef.current.generateCaption(mediaType, description));
  }, [withGeneration]);

  const getStatus = useCallback(() => {
    return llmRef.current.getStatus();
  }, []);

  return {
    isReady,
    isLoading,
    isGenerating,
    error,
    initialize,
    chat,
    generatePost,
    generateArticle,
    generateHashtags,
    summarize,
    analyzeSentiment,
    translate,
    generateCaption,
    getStatus,
  };
}
