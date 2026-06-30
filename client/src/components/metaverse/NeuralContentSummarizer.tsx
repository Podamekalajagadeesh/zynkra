import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Brain, 
  FileText, 
  Clock, 
  Play, 
  Pause, 
  Check, 
  Loader2, 
  Video, 
  Calendar, 
  Heart, 
  Sparkles,
  List,
  MessageSquare,
  MapPin,
  BookOpen,
  Zap,
  Users
} from 'lucide-react';
import { useNeuralState } from '../../hooks/useNeuralState';

interface ImmersiveContent {
  id: string;
  title: string;
  type: 'event' | 'memory' | 'virtual-world' | 'concert' | 'conference' | 'stream';
  originalDuration: number; // in minutes
  thumbnailUrl?: string;
  date: string;
  location: string;
  participants: number;
  keyHighlights: ContentHighlight[];
  emotionTimeline: EmotionPoint[];
  sensoryHighlights: string[];
}

interface ContentHighlight {
  timestamp: number;
  title: string;
  description: string;
  importance: number; // 0-100
  duration: number;
}

interface EmotionPoint {
  timestamp: number;
  emotion: string;
  intensity: number;
}

interface SummarizationState {
  isProcessing: boolean;
  processingProgress: number;
  summarizedContent: SummarizedContent | null;
  selectedContent: ImmersiveContent | null;
  targetDuration: number; // user's desired summary length in minutes
  isPlaying: boolean;
  currentPlaybackTime: number;
}

interface SummarizedContent {
  duration: number;
  highlights: ContentHighlight[];
  summaryText: string;
  keyTakeaways: string[];
  recommendedNextContent: string[];
}

// Mock content library for demonstration
const MOCK_CONTENT: ImmersiveContent[] = [
  {
    id: 'content-1',
    title: 'Metaverse Music Festival 2056',
    type: 'concert',
    originalDuration: 360, // 6 hours
    date: '2056-06-15',
    location: 'Neon Oasis Virtual Venue',
    participants: 125000,
    keyHighlights: [
      { timestamp: 15, title: 'Headliner Opening', description: 'Main act takes the virtual stage with stunning visual effects', importance: 95, duration: 45 },
      { timestamp: 120, title: 'Special Guest Collaboration', description: 'Surprise guest joins for a never-before-seen performance', importance: 90, duration: 30 },
      { timestamp: 240, title: 'Interactive Light Show', description: 'Audience participation creates synchronized visual experience', importance: 85, duration: 20 },
      { timestamp: 300, title: 'Dawn Finale Performance', description: 'Emotional closing set as virtual sun rises over the venue', importance: 100, duration: 60 }
    ],
    emotionTimeline: [
      { timestamp: 0, emotion: 'excitement', intensity: 80 },
      { timestamp: 60, emotion: 'joy', intensity: 90 },
      { timestamp: 180, emotion: 'awe', intensity: 95 },
      { timestamp: 300, emotion: 'euphoria', intensity: 100 }
    ],
    sensoryHighlights: ['spatial audio 3D', 'haptic feedback vibrations', 'dynamic lighting', 'crowd sensory synchronization']
  },
  {
    id: 'content-2',
    title: 'Global Climate Summit Virtual Conference',
    type: 'conference',
    originalDuration: 480, // 8 hours
    date: '2056-05-22',
    location: 'Global Collaborative Hub',
    participants: 15000,
    keyHighlights: [
      { timestamp: 30, title: 'Opening Keynote', description: 'UN Secretary General presents global action plan', importance: 95, duration: 60 },
      { timestamp: 150, title: 'Breakthrough Technology Reveal', description: 'New carbon removal technology demonstrated', importance: 98, duration: 45 },
      { timestamp: 280, title: 'Youth Delegation Presentation', description: 'Next generation leaders outline their demands', importance: 85, duration: 40 },
      { timestamp: 400, title: 'Final Agreement Signing', description: 'Historic international agreement signed virtually', importance: 100, duration: 30 }
    ],
    emotionTimeline: [
      { timestamp: 0, emotion: 'seriousness', intensity: 70 },
      { timestamp: 150, emotion: 'hopefulness', intensity: 85 },
      { timestamp: 300, emotion: 'determination', intensity: 90 },
      { timestamp: 450, emotion: 'optimism', intensity: 95 }
    ],
    sensoryHighlights: ['immersive data visualization', 'multi-language real-time translation', 'emotional tone modulation', 'global participant network map']
  },
  {
    id: 'content-3',
    title: 'Family Summer Vacation Memory Collection',
    type: 'memory',
    originalDuration: 720, // 12 hours of memories
    date: '2056-07-01',
    location: 'Mediterranean Coastal Villa',
    participants: 8,
    keyHighlights: [
      { timestamp: 60, title: 'Sunset Beach Dinner', description: 'First evening gathering with all family members', importance: 90, duration: 45 },
      { timestamp: 200, title: 'Deep Sea Exploration', description: 'Shared underwater adventure with submersible tour', importance: 95, duration: 60 },
      { timestamp: 450, title: 'Traditional Cooking Class', description: 'Grandma teaching family recipe to younger generation', importance: 85, duration: 90 },
      { timestamp: 650, title: 'Farewell Stargazing', description: 'Final night together under the stars with shared stories', importance: 100, duration: 40 }
    ],
    emotionTimeline: [
      { timestamp: 0, emotion: 'happiness', intensity: 85 },
      { timestamp: 180, emotion: 'wonder', intensity: 95 },
      { timestamp: 400, emotion: 'warmth', intensity: 90 },
      { timestamp: 650, emotion: 'nostalgia', intensity: 95 }
    ],
    sensoryHighlights: ['ocean wave haptics', 'salt air scent replication', 'Mediterranean food taste overlay', 'starlight visual intensity modulation']
  }
];

export const NeuralContentSummarizer: React.FC = () => {
  const { addToast } = useToast();
  const { neuralState } = useNeuralState();
  const [privacySettings, setPrivacySettings] = useState<any>({});
  const [summarizationState, setSummarizationState] = useState<SummarizationState>({
    isProcessing: false,
    processingProgress: 0,
    summarizedContent: null,
    selectedContent: null,
    targetDuration: 5, // Default to 5 minutes as requested
    isPlaying: false,
    currentPlaybackTime: 0
  });
  
  const [activeTab, setActiveTab] = useState('library');

  // Simulate processing progress when summarization is active
  useEffect(() => {
    if (!summarizationState.isProcessing) return;
    
    const progressInterval = setInterval(() => {
      setSummarizationState(prev => {
        const newProgress = prev.processingProgress + Math.random() * 15;
        if (newProgress >= 100) {
          // Processing complete
          const generatedSummary = generateSummary(prev.selectedContent!, prev.targetDuration);
          return {
            ...prev,
            isProcessing: false,
            processingProgress: 100,
            summarizedContent: generatedSummary
          };
        }
        return { ...prev, processingProgress: newProgress };
      });
    }, 500);

    return () => clearInterval(progressInterval);
  }, [summarizationState.isProcessing]);

  // Simulate playback when active
  useEffect(() => {
    if (!summarizationState.isPlaying || !summarizationState.summarizedContent) return;
    
    const playbackInterval = setInterval(() => {
      setSummarizationState(prev => {
        const newTime = prev.currentPlaybackTime + 1;
        if (newTime >= prev.summarizedContent!.duration * 60) {
          // Playback complete
          return { ...prev, isPlaying: false, currentPlaybackTime: 0 };
        }
        return { ...prev, currentPlaybackTime: newTime };
      });
    }, 1000);

    return () => clearInterval(playbackInterval);
  }, [summarizationState.isPlaying, summarizationState.summarizedContent]);

  const generateSummary = (content: ImmersiveContent, targetMinutes: number): SummarizedContent => {
    // Sort highlights by importance and select what fits in target duration
    const sortedHighlights = [...content.keyHighlights].sort((a, b) => b.importance - a.importance);
    let totalDuration = 0;
    const selectedHighlights: ContentHighlight[] = [];
    
    for (const highlight of sortedHighlights) {
      if (totalDuration + highlight.duration <= targetMinutes) {
        selectedHighlights.push(highlight);
        totalDuration += highlight.duration;
      }
    }

    // Generate natural language summary
    const summaryText = `This neural summary condenses ${content.originalDuration} minutes of immersive ${content.type} content into ${targetMinutes} digestible minutes. The experience captures the most emotionally resonant and significant moments from "${content.title}", preserving all critical sensory and emotional context while eliminating redundant content.`;

    const keyTakeaways = content.keyHighlights.slice(0, 3).map(h => h.title);
    
    return {
      duration: totalDuration,
      highlights: selectedHighlights,
      summaryText,
      keyTakeaways,
      recommendedNextContent: ['Similar events you might enjoy', 'Content from the same creators', 'Related immersive experiences']
    };
  };

  const startSummarization = (content: ImmersiveContent) => {
    setSummarizationState({
      isProcessing: true,
      processingProgress: 0,
      summarizedContent: null,
      selectedContent: content,
      targetDuration: summarizationState.targetDuration,
      isPlaying: false,
      currentPlaybackTime: 0
    });
    
    addToast({
      type: 'info',
      message: `Starting neural summarization of "${content.title}". Analyzing ${content.originalDuration} minutes of content...`
    });
  };

  const togglePlayback = () => {
    setSummarizationState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'concert': return <Sparkles className="h-4 w-4 text-pink-500" />;
      case 'conference': return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'memory': return <Heart className="h-4 w-4 text-red-500" />;
      default: return <Video className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Brain className="h-10 w-10 text-purple-500" />
          <div>
            <h1 className="text-4xl font-bold">Neural Content Summarization</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Condense hours of immersive content into digestible experiences tailored to your preferences
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 max-w-md">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Content Library
          </TabsTrigger>
          <TabsTrigger value="summarize" className="flex items-center gap-2" disabled={!summarizationState.selectedContent}>
            <Zap className="h-4 w-4" />
            Summarize
          </TabsTrigger>
          <TabsTrigger value="player" className="flex items-center gap-2" disabled={!summarizationState.summarizedContent}>
            <Play className="h-4 w-4" />
            Play Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-6">
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your preferred summary length</h3>
              <Badge variant="outline" className="text-lg">{summarizationState.targetDuration} minutes</Badge>
            </div>
            <Slider 
              defaultValue={[5]} 
              max={60} 
              step={1} 
              value={[summarizationState.targetDuration]}
              onValueChange={(vals) => setSummarizationState(prev => ({ ...prev, targetDuration: vals[0] }))}
              className="mb-2"
            />
            <p className="text-sm text-gray-500">Adjust how long you want your summarized content to be (1-60 minutes)</p>
          </div>

          <h3 className="text-xl font-semibold mb-4">Your Immersive Content Library</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_CONTENT.map(content => (
              <Card key={content.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  {getTypeIcon(content.type)}
                  <span className="ml-2 text-white font-semibold capitalize">{content.type}</span>
                </div>
                <div className="p-5">
                  <h4 className="text-lg font-semibold mb-2">{content.title}</h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{content.originalDuration} minutes original length</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{content.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{content.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{content.participants.toLocaleString()} participants</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {content.sensoryHighlights.slice(0, 2).map(sensory => (
                      <Badge key={sensory} variant="secondary">{sensory}</Badge>
                    ))}
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSummarizationState(prev => ({ ...prev, selectedContent: content }));
                      setActiveTab('summarize');
                    }}
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    Summarize This Content
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="summarize" className="space-y-6">
          {summarizationState.selectedContent && (
            <Card className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Neural Analysis in Progress</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Analyzing "{summarizationState.selectedContent.title}" to create your {summarizationState.targetDuration}-minute summary
                </p>
                
                {summarizationState.isProcessing ? (
                  <div className="max-w-md mx-auto">
                    <Progress value={summarizationState.processingProgress} className="h-3 mb-4" />
                    <p className="text-sm text-gray-500 flex items-center justify-center">
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Processing: {Math.round(summarizationState.processingProgress)}% complete
                    </p>
                    <div className="mt-8 text-left space-y-4">
                      <h4 className="font-semibold">What our AI is analyzing:</h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Extracting emotional peaks and key narrative moments</span>
                        </li>
                        <li className="flex items-start gap-2">
                          {summarizationState.processingProgress > 30 ? <Check className="h-4 w-4 text-green-500 mt-0.5" /> : <Loader2 className="animate-spin h-4 w-4 text-yellow-500 mt-0.5" />}
                          <span>Identifying critical sensory experiences to preserve</span>
                        </li>
                        <li className="flex items-start gap-2">
                          {summarizationState.processingProgress > 60 ? <Check className="h-4 w-4 text-green-500 mt-0.5" /> : <Loader2 className="animate-spin h-4 w-4 text-yellow-500 mt-0.5" />}
                          <span>Aligning summary with your neural engagement patterns</span>
                        </li>
                        <li className="flex items-start gap-2">
                          {summarizationState.processingProgress > 90 ? <Check className="h-4 w-4 text-green-500 mt-0.5" /> : <Loader2 className="animate-spin h-4 w-4 text-yellow-500 mt-0.5" />}
                          <span>Compiling into cohesive {summarizationState.targetDuration}-minute experience</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div>
                    {!summarizationState.summarizedContent && (
                      <Button 
                        size="lg" 
                        onClick={() => startSummarization(summarizationState.selectedContent!)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Brain className="mr-2 h-5 w-5" />
                        Start Neural Summarization
                      </Button>
                    )}
                    
                    {summarizationState.summarizedContent && (
                      <div className="text-center">
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg inline-block">
                          <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <p className="text-green-700 dark:text-green-400 font-semibold">Summarization Complete!</p>
                        </div>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                          Created a {summarizationState.summarizedContent.duration}-minute summary from {summarizationState.selectedContent.originalDuration} minutes of original content
                        </p>
                        <Button 
                          size="lg"
                          onClick={() => setActiveTab('player')}
                        >
                          <Play className="mr-2 h-5 w-5" />
                          Play Your Summary
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="player" className="space-y-6">
          {summarizationState.summarizedContent && summarizationState.selectedContent && (
            <div className="max-w-4xl mx-auto">
              <Card className="p-8 mb-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{summarizationState.selectedContent.title}</h3>
                  <Badge className="mb-4">Neural Summary: {summarizationState.summarizedContent.duration} minutes</Badge>
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    {summarizationState.summarizedContent.summaryText}
                  </p>
                </div>

                {/* Playback controls */}
                <div className="max-w-xl mx-auto mb-8">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-4">
                    <Progress 
                      value={(summarizationState.currentPlaybackTime / (summarizationState.summarizedContent.duration * 60)) * 100} 
                      className="h-2" 
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span>{formatTime(summarizationState.currentPlaybackTime)}</span>
                    <span>{formatTime(summarizationState.summarizedContent.duration * 60)}</span>
                  </div>
                  <div className="flex justify-center">
                    <Button 
                      size="lg" 
                      className="rounded-full w-16 h-16"
                      onClick={togglePlayback}
                    >
                      {summarizationState.isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                    </Button>
                  </div>
                </div>

                {/* Highlights timeline */}
                <div className="border-t pt-8">
                  <h4 className="text-xl font-semibold mb-4">Summary Highlights</h4>
                  <div className="space-y-4">
                    {summarizationState.summarizedContent.highlights.map((highlight, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-semibold">{highlight.title}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{highlight.description}</p>
                          </div>
                          <Badge variant="outline">{highlight.duration} min</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Key takeaways */}
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Key Takeaways</h4>
                <ul className="space-y-2">
                  {summarizationState.summarizedContent.keyTakeaways.map((takeaway, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};