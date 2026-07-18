import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Sparkles, Send, X, Wand2, Brain, Image as ImageIcon, Music, Lightbulb, RefreshCw, Copy, Check } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';

interface AICoPilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: ContentSuggestion[];
}

interface ContentSuggestion {
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
    // In a real app, this would call an AI API
    // For now, we'll generate context-aware suggestions based on the user's prompt
    const lowerPrompt = userPrompt.toLowerCase();
    
    const suggestions: ContentSuggestion[] = [];
    
    // Memory-specific suggestions
    if (contentType === 'memory') {
      if (lowerPrompt.includes('birthday') || lowerPrompt.includes('party')) {
        suggestions.push({
          id: `memory-birthday-${Date.now()}`,
          type: 'sensory',
          title: 'Enhanced Birthday Memory',
          description: 'Add rich sensory details to your birthday memory',
          content: `${userPrompt}\n\nThe room was filled with the sweet scent of vanilla cake, and laughter echoed off the walls as friends sang. I felt the warmth of everyone's presence, the excitement building as I blew out the candles. The sound of clapping and cheers created a moment frozen in time, every detail etched into my memory forever. The flickering candlelight danced across everyone's smiling faces, and the taste of the first bite of cake - perfectly sweet with a hint of chocolate - remains with me still.`,
          mediaSuggestions: ['birthday_group.jpg', 'singing_happy_birthday.aac', 'cake_cutting.mp4'],
          emotionalContext: { joy: 95, excitement: 90, love: 88, surprise: 75 }
        });
      } else if (lowerPrompt.includes('travel') || lowerPrompt.includes('trip') || lowerPrompt.includes('vacation')) {
        suggestions.push({
          id: `memory-travel-${Date.now()}`,
          type: 'immersive',
          title: 'Immersive Travel Memory',
          description: 'Create a fully immersive travel memory experience',
          content: `${userPrompt}\n\nStanding at the summit, I breathed in the crisp mountain air, the panoramic view stretching endlessly before me. The wind whipped through my hair, carrying the distant sound of a stream far below. Every sense was alive: the sight of endless peaks, the smell of pine trees, the cool breeze on my skin, the feeling of accomplishment that flooded through me. This wasn't just a view - it was an experience that connected me to something larger than myself. I could feel the weight of the journey that brought me here, every step leading to this perfect moment of clarity and wonder.`,
          mediaSuggestions: ['mountain_view.jpg', 'wind_in_pines.aac', 'hiking_timelapse.mp4'],
          emotionalContext: { joy: 92, excitement: 88, calm: 85, wonder: 95 }
        });
      } else if (lowerPrompt.includes('wedding') || lowerPrompt.includes('marriage') || lowerPrompt.includes('love')) {
        suggestions.push({
          id: `memory-wedding-${Date.now()}`,
          type: 'emotional',
          title: 'Deeply Emotional Wedding Memory',
          description: 'Capture the emotional depth of your special day',
          content: `${userPrompt}\n\nAs I looked into their eyes, time seemed to stand still. The world narrowed to just the two of us, the sounds of the crowd fading into the background. I felt tears of joy welling up, my heart so full it might burst. The warmth of their hand in mine, the quiet promise in their voice - every detail was seared into my soul. The flower petals drifted down around us like colorful snow, and the music that began to play seemed to be written specifically for this moment. In that instant, I knew this memory would sustain me for a lifetime.`,
          mediaSuggestions: ['first_look.jpg', 'vows.aac', 'first_dance.mp4'],
          emotionalContext: { love: 98, joy: 95, calm: 80, surprise: 70, tears: 85 }
        });
      }
    }
    
    // Post-specific suggestions
    if (contentType === 'post') {
      if (lowerPrompt.includes('art') || lowerPrompt.includes('creative') || lowerPrompt.includes('design')) {
        suggestions.push({
          id: `post-art-${Date.now()}`,
          type: 'story',
          title: 'Creative Art Post',
          description: 'A compelling post about your creative work',
          content: `${userPrompt}\n\nEvery piece I create holds a piece of my journey. This one started with a single sketch on a napkin, and over weeks it evolved into something that surprised even me. The creative process isn't always easy - there were moments I wanted to scrap it all, but something pushed me to keep going. I'm sharing it here because art is meant to be shared, to evoke feelings in others that they couldn't name themselves. What does this piece make you feel? Let me know in the comments - your interpretations are as much a part of this work as my creation of it.`,
          mediaSuggestions: ['work_in_progress.jpg', 'final_piece.mp4', 'process_timelapse.mp4'],
          emotionalContext: { pride: 90, vulnerability: 75, excitement: 88, curiosity: 82 }
        });
      } else if (lowerPrompt.includes('food') || lowerPrompt.includes('cooking') || lowerPrompt.includes('recipe')) {
        suggestions.push({
          id: `post-food-${Date.now()}`,
          type: 'sensory',
          title: 'Sensory Food Experience Post',
          description: 'Make your food post come alive with sensory details',
          content: `${userPrompt}\n\nThe aroma that filled the kitchen as this dish came together was incredible - garlic, herbs, and slow-cooked tomatoes that had been simmering for hours. The first bite was perfect: the pasta perfectly al dente, the sauce rich and complex, with just the right amount of heat that builds gently. I spent an entire afternoon perfecting this recipe, testing ratios, adjusting seasonings, and I'm so excited to share it with you. The colors alone make it worth it - deep reds, fresh greens, the golden crust of homemade bread on the side. This is more than food; it's love made edible, meant to be shared with people who matter most.`,
          mediaSuggestions: ['cooking_process.mp4', 'finished_plate.jpg', 'serving_bread.mp4'],
          emotionalContext: { joy: 90, satisfaction: 85, excitement: 92, comfort: 88 }
        });
      }
    }
    
    // Generic suggestion if no specific case matches
    if (suggestions.length === 0) {
      suggestions.push({
        id: `enhanced-generic-${Date.now()}`,
        type: 'immersive',
        title: 'Enhanced Immersive Version',
        description: 'Transform your content into an immersive experience',
        content: `${userPrompt}\n\nWhat I didn't mention in that simple description is the depth of the moment - the way the light fell, the sounds that surrounded me, the emotions that coursed through my body as everything unfolded. This wasn't just something that happened; it was something I experienced with every fiber of my being. I want to share not just what happened, but what it felt like, so you can experience it almost as if you were there with me. The small details that might seem insignificant are actually what make this memory or moment so profound - a stranger's smile, the way the wind changed direction, the unexpected text message that arrived right when I needed it. Every piece came together to create magic.`,
        mediaSuggestions: ['main_photo.jpg', 'ambience_audio.aac', 'b-roll_video.mp4'],
        emotionalContext: { ...existingEmotions, joy: Math.max(existingEmotions.joy || 50, 75), wonder: 80, gratitude: 85 }
      });
    }
    
    return suggestions;
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
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
      await new Promise(resolve => setTimeout(resolve, 2000));
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
          <h3 className="font-bold text-lg">Creative AI Co-Pilot</h3>
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