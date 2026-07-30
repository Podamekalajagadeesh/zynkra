import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Sparkles, Send, X, Wand2, Brain, Image as ImageIcon, Music, Lightbulb, RefreshCw, Copy, Check } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';

interface AICoPilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: ContentSuggestion[];
}

export interface ContentSuggestion {
  id: string;
  type: 'caption' | 'story' | 'sensory' | 'emotional' | 'immersive';
  title: string;
  description: string;
  content: string;
  mediaSuggestions?: string[];
  emotionalContext?: Record<string, number>;
}

interface AICoPilotPanelProps {
  currentContent: string;
  currentMediaCount: number;
  contentType: 'post' | 'memory' | 'immersive';
  onApplySuggestion: (suggestion: ContentSuggestion) => void;
  onClose: () => void;
  existingEmotions?: Record<string, number>;
}

export const AICoPilotPanel: React.FC<AICoPilotPanelProps> = ({
  currentContent,
  currentMediaCount,
  contentType,
  onApplySuggestion,
  onClose,
  existingEmotions = {}
}) => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<AICoPilotMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your creative AI co-pilot. I can help you create amazing ${contentType}s. Tell me what you want to create, and I'll help you craft immersive experiences, enhance your memories, or generate creative content that neither of us could create alone. What's on your mind?`,
      timestamp: new Date(),
      suggestions: [
        {
          id: 's1',
          type: 'immersive',
          title: 'Beach Sunset Memory',
          description: 'Create a vivid sensory memory of a sunset at the beach',
          content: 'As the golden sun dips below the horizon, painting the sky in hues of orange and purple, I feel the warm sand beneath my feet and hear the gentle crash of waves. The salt air fills my lungs, and in that moment, everything feels perfect - a memory I want to preserve forever.',
          mediaSuggestions: ['sunset.jpg', 'waves.mp3', 'seagulls.aac'],
          emotionalContext: { joy: 85, calm: 90, love: 75, excitement: 60 }
        },
        {
          id: 's2',
          type: 'story',
          title: 'Urban Adventure Story',
          description: 'A captivating story of exploring a new city',
          content: 'Wandering through the narrow cobblestone streets, I discovered hidden cafes, street art that told stories, and locals who shared their favorite spots. The city came alive at night with neon lights reflecting off rain-soaked streets, each corner holding a new adventure waiting to unfold.',
          mediaSuggestions: ['street_art.jpg', 'city_night.mp4', 'city_ambience.aac'],
          emotionalContext: { excitement: 95, surprise: 80, joy: 88, curiosity: 92 }
        }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAISuggestions = async (userPrompt: string): Promise<ContentSuggestion[]> => {
    try {
      const suggestions: ContentSuggestion[] = [];

      // Call multiple AI endpoints in parallel
      const [generateRes, hashtagsRes, captionRes, analyzeRes] = await Promise.allSettled([
        api.post('/ai/content/generate', {
          topic: userPrompt,
          type: contentType === 'memory' ? 'story' : 'tutorial',
          details: userPrompt,
          tone: 'inspirational',
        }),
        api.post('/ai/content/hashtags', { topic: userPrompt }),
        api.post('/ai/content/caption', { mediaType: 'image', keywords: [userPrompt] }),
        api.post('/ai/content/analyze', { content: userPrompt }),
      ]);

      // Build suggestions from generate response
      if (generateRes.status === 'fulfilled') {
        const data = generateRes.value.data;
        const contents = Array.isArray(data?.content) ? data.content : [data?.content || ''];
        const hashtags = Array.isArray(data?.hashtags) ? data.hashtags : [];

        contents.slice(0, 3).forEach((text: string, i: number) => {
          const types: Array<ContentSuggestion['type']> = ['immersive', 'sensory', 'emotional'];
          suggestions.push({
            id: `ai-gen-${Date.now()}-${i}`,
            type: types[i % types.length],
            title: `AI Suggestion ${i + 1}`,
            description: `AI-generated ${contentType} content based on your prompt`,
            content: text,
            mediaSuggestions: ['suggested_photo.jpg', 'background_music.aac'],
            emotionalContext: { ...existingEmotions, joy: 80, excitement: 75 }
          });
        });
      }

      // Add hashtag suggestion card
      if (hashtagsRes.status === 'fulfilled' && Array.isArray(hashtagsRes.value.data) && hashtagsRes.value.data.length > 0) {
        suggestions.push({
          id: `ai-hashtags-${Date.now()}`,
          type: 'caption',
          title: 'Hashtag Recommendations',
          description: 'Trending hashtags for your content',
          content: `Recommended hashtags:\n${hashtagsRes.value.data.join('\n')}`,
          emotionalContext: existingEmotions
        });
      }

      // Add caption suggestion card
      if (captionRes.status === 'fulfilled' && Array.isArray(captionRes.value.data) && captionRes.value.data.length > 0) {
        suggestions.push({
          id: `ai-caption-${Date.now()}`,
          type: 'caption',
          title: 'Caption Ideas',
          description: 'AI-generated captions for your media',
          content: captionRes.value.data.join('\n\n---\n\n'),
          emotionalContext: existingEmotions
        });
      }

      // If all API calls failed, fall back to template suggestions
      if (suggestions.length === 0) {
        return getFallbackSuggestions(userPrompt);
      }

      return suggestions;
    } catch {
      return getFallbackSuggestions(userPrompt);
    }
  };

  // Template-based fallback when API is unavailable
  const getFallbackSuggestions = (userPrompt: string): ContentSuggestion[] => {
    return [
      {
        id: `fallback-${Date.now()}`,
        type: 'immersive',
        title: 'Enhanced Immersive Version',
        description: 'Transform your content into an immersive experience',
        content: `${userPrompt}\n\nWhat I didn't mention in that simple description is the depth of the moment - the way the light fell, the sounds that surrounded me, the emotions that coursed through my body as everything unfolded. This wasn't just something that happened; it was something I experienced with every fiber of my being. I want to share not just what happened, but what it felt like, so you can experience it almost as if you were there with me. The small details that might seem insignificant are actually what make this memory or moment so profound - a stranger's smile, the way the wind changed direction, the unexpected text message that arrived right when I needed it. Every piece came together to create magic.`,
        mediaSuggestions: ['main_photo.jpg', 'ambience_audio.aac', 'b-roll_video.mp4'],
        emotionalContext: { ...existingEmotions, joy: Math.max(existingEmotions.joy || 50, 75), wonder: 80, gratitude: 85 }
      }
    ];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: AICoPilotMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const suggestions = await generateAISuggestions(inputValue);
      
      const aiResponse: AICoPilotMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I've created some enhanced versions of your idea! These add immersive, sensory, and emotional details to make your content come alive. You can apply any of these suggestions to your current post or memory.",
        timestamp: new Date(),
        suggestions
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to generate AI suggestions' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnhanceCurrentContent = async () => {
    if (!currentContent.trim()) {
      addToast({ type: 'warning', message: 'Please add some content first before asking AI to enhance it' });
      return;
    }
    
    setIsProcessing(true);
    try {
      const suggestions = await generateAISuggestions(currentContent);
      
      const aiResponse: AICoPilotMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I've enhanced your existing content with immersive details, sensory descriptions, and emotional depth. Here are some options to take your content to the next level:",
        timestamp: new Date(),
        suggestions
      };
      
      setMessages(prev => [...prev, aiResponse]);
      addToast({ type: 'success', message: 'AI has enhanced your content!' });
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to enhance content' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopySuggestion = (suggestion: ContentSuggestion) => {
    navigator.clipboard.writeText(suggestion.content);
    setCopiedId(suggestion.id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast({ type: 'success', message: 'Copied to clipboard!' });
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'caption': return <Sparkles className="h-4 w-4" />;
      case 'story': return <Lightbulb className="h-4 w-4" />;
      case 'sensory': return <Music className="h-4 w-4" />;
      case 'emotional': return <Brain className="h-4 w-4" />;
      case 'immersive': return <Wand2 className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <Card className="fixed inset-0 md:inset-auto md:right-4 md:top-20 md:w-[500px] md:h-[calc(100vh-120px)] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col rounded-none md:rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-bold text-lg">Creative AI Co-Pilot (Preview)</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Quick Actions */}
      <div className="p-3 border-b bg-gray-50 dark:bg-gray-800 flex flex-wrap gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleEnhanceCurrentContent}
          disabled={isProcessing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
          Enhance My Content
        </Button>
        <Badge variant="secondary" className="flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          {currentMediaCount} media files
        </Badge>
        <Badge variant="outline" className="capitalize">
          {contentType}
        </Badge>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[90%] rounded-2xl p-4 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-md' 
                  : 'bg-gray-100 dark:bg-gray-800 rounded-bl-md'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              
              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-4 space-y-3">
                  {message.suggestions.map((suggestion) => (
                    <Card key={suggestion.id} className="p-3 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(suggestion.type)}
                          <span className="font-semibold text-sm">{suggestion.title}</span>
                          <Badge variant="outline" className="text-xs capitalize">{suggestion.type}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCopySuggestion(suggestion)}
                            className="h-8 w-8 p-0"
                          >
                            {copiedId === suggestion.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => onApplySuggestion(suggestion)}
                            className="bg-purple-600 hover:bg-purple-700 text-xs"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{suggestion.description}</p>
                      <p className="text-xs line-clamp-3 text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-black/20 p-2 rounded">
                        {suggestion.content.substring(0, 200)}...
                      </p>
                      {suggestion.mediaSuggestions && suggestion.mediaSuggestions.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          <span className="text-xs text-gray-500">Suggested media:</span>
                          {suggestion.mediaSuggestions.map((media, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{media}</Badge>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-sm text-gray-500 ml-2">AI is crafting something amazing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tell me what you want to create..."
            className="flex-1 resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isProcessing}
            className="bg-purple-600 hover:bg-purple-700 self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Your AI co-pilot helps you create immersive experiences, enhance memories, and craft creative content.
        </p>
      </div>
    </Card>
  );
};