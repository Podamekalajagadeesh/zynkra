import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Brain, 
  Search, 
  Loader2, 
  User, 
  FileText, 
  Hash, 
  MapPin, 
  Calendar,
  Heart,
  Lightbulb,
  Globe,
  Sparkles,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { useNeuralState, NeuralState } from '../../hooks/useNeuralState';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'memory' | 'event' | 'group';
  title: string;
  description: string;
  relevance: number; // 0-100, how well this matches your thought
  thumbnailUrl?: string;
  url: string;
  emotionMatch?: number;
}

interface NeuralSearchState {
  isSearching: boolean;
  lastSearchTime: Date | null;
  searchResults: SearchResult[];
  currentThoughtContext: {
    inferredQuery: string;
    capturedEmotions: NeuralState['emotions'];
    searchIntent: string;
  } | null;
}

export const NeuralSearch: React.FC = () => {
  const { addToast } = useToast();
  const { neuralState } = useNeuralState();
  const [isNeuralSearchActive, setIsNeuralSearchActive] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [searchState, setSearchState] = useState<NeuralSearchState>({
    isSearching: false,
    lastSearchTime: null,
    searchResults: [],
    currentThoughtContext: null,
  });
  const [activeTab, setActiveTab] = useState('neural');

  // Simulate continuous thought processing when neural search is active
  useEffect(() => {
    if (!isNeuralSearchActive) return;

    // Every 10 seconds, analyze current neural state to update search context
    const analysisInterval = setInterval(() => {
      analyzeCurrentThoughts();
    }, 10000);

    // Initial analysis
    analyzeCurrentThoughts();

    return () => clearInterval(analysisInterval);
  }, [isNeuralSearchActive]);

  const analyzeCurrentThoughts = async () => {
    // In a real implementation, this would send neural state to a backend that
    // uses brain-computer interface data to infer search intent
    // For this implementation, we'll simulate the inference
    const simulatedInference = simulateNeuralInference();
    
    setSearchState(prev => ({
      ...prev,
      currentThoughtContext: {
        inferredQuery: simulatedInference.query,
        capturedEmotions: { ...neuralState.emotions },
        searchIntent: simulatedInference.intent,
      }
    }));

    // Auto-search if we're confident about the intent
    if (simulatedInference.confidence > 75) {
      performNeuralSearch(simulatedInference.query);
    }
  };

  const simulateNeuralInference = () => {
    // In production, this would be a real ML model that processes neural signals
    // Here we'll return simulated queries based on current emotional state
    const dominantEmotion = Object.entries(neuralState.emotions)
      .reduce((a, b) => a[1] > b[1] ? a : b);

    const inferenceTemplates = [
      {
        emotions: ['happiness', 'excitement'],
        queries: [
          'beach vacation photos', 'sunset landscapes', 'party events nearby', 'concert tickets', 'outdoor activities'
        ],
        intents: 'Looking for content related to positive experiences'
      },
      {
        emotions: ['calmness', 'mindfulness'],
        queries: [
          'meditation guides', 'nature documentaries', 'yoga tutorials', 'quiet music', 'mindfulness content'
        ],
        intents: 'Seeking calm and relaxing content'
      },
      {
        emotions: ['curiosity', 'surprise'],
        queries: [
          'latest technology news', 'science discoveries', 'new research papers', 'innovative products', 'learn new skills'
        ],
        intents: 'Exploring new information and learning opportunities'
      },
      {
        emotions: ['sadness', 'anxiety'],
        queries: [
          'comforting movies', 'motivational content', 'support groups', 'mental health resources', 'friends activity feeds'
        ],
        intents: 'Looking for supportive and comforting content'
      },
      {
        emotions: ['anger', 'frustration'],
        queries: [
          'community forums', 'debate topics', 'social justice content', 'actionable solutions', 'petition platforms'
        ],
        intents: 'Seeking to engage with topics that matter to you'
      }
    ];

    const matchedTemplate = inferenceTemplates.find(t => t.emotions.includes(dominantEmotion[0])) 
      || inferenceTemplates[0];
    
    const randomQuery = matchedTemplate.queries[Math.floor(Math.random() * matchedTemplate.queries.length)];
    const confidence = 60 + Math.random() * 35; // 60-95% confidence

    return {
      query: randomQuery,
      intent: matchedTemplate.intents,
      confidence
    };
  };

  const performNeuralSearch = async (query: string) => {
    setSearchState(prev => ({ ...prev, isSearching: true }));
    
    try {
      // In production, this would send the neural context to a search backend
      // that understands your thought patterns and finds relevant content
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      
      // Generate simulated search results
      const results = generateSimulatedResults(query);
      
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        lastSearchTime: new Date(),
        searchResults: results,
      }));

      addToast({
        type: 'success',
        message: `Found ${results.length} results matching your thought about "${query}"`
      });
    } catch (error) {
      setSearchState(prev => ({ ...prev, isSearching: false }));
      addToast({
        type: 'error',
        message: 'Neural search failed. Please try again.'
      });
    }
  };

  const generateSimulatedResults = (query: string): SearchResult[] => {
    // Simulate different types of search results based on the query
    const resultTypes: Array<'post' | 'user' | 'memory' | 'event' | 'group'> = ['post', 'user', 'memory', 'event', 'group'];
    const results: SearchResult[] = [];

    for (let i = 0; i < 10; i++) {
      const type = resultTypes[Math.floor(Math.random() * resultTypes.length)];
      const baseRelevance = 95 - (i * 8); // Decreasing relevance for later results
      
      results.push({
        id: `result-${Date.now()}-${i}`,
        type,
        title: getTitleForType(type, query),
        description: getDescriptionForType(type, query),
        relevance: Math.max(40, baseRelevance + (Math.random() * 10 - 5)),
        thumbnailUrl: `https://picsum.photos/seed/${query}${i}/100/100`,
        url: getUrlForType(type, i),
        emotionMatch: 70 + Math.random() * 25,
      });
    }

    return results;
  };

  const getTitleForType = (type: string, query: string): string => {
    const titles: Record<string, string[]> = {
      post: [`Amazing ${query} guide`, `Your friends thought about ${query}`, `The complete introduction to ${query}`],
      user: [`Sarah who loves ${query}`, `Mike - ${query} expert`, `Community group for ${query}`],
      memory: [`Your memory of ${query} from last year`, `Shared memory of ${query} with friends`, `Highlight memory: ${query}`],
      event: [`Upcoming ${query} workshop`, `${query} conference 2026`, `Local meetup for ${query} enthusiasts`],
      group: [`${query} fans community`, `Learn ${query} together`, `${query} professionals network`]
    };
    const typeTitles = titles[type] || titles.post;
    return typeTitles[Math.floor(Math.random() * typeTitles.length)];
  };

  const getDescriptionForType = (type: string, query: string): string => {
    return `This is relevant content about ${query} that matches what you're currently thinking about. Our neural search identified this as something that might interest you based on your current state of mind.`;
  };

  const getUrlForType = (type: string, id: number): string => {
    const urls: Record<string, string> = {
      post: `/post/${id}`,
      user: `/profile/user-${id}`,
      memory: `/memories/${id}`,
      event: `/events/${id}`,
      group: `/groups/${id}`
    };
    return urls[type] || `/post/${id}`;
  };

  const performManualSearch = () => {
    if (!manualQuery.trim()) return;
    performNeuralSearch(manualQuery);
  };

  const triggerManualNeuralAnalysis = () => {
    analyzeCurrentThoughts();
    addToast({
      type: 'info',
      message: 'Analyzing your current thoughts...'
    });
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'post': return <FileText className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      case 'memory': return <Calendar className="h-4 w-4" />;
      case 'event': return <MapPin className="h-4 w-4" />;
      case 'group': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'post': return 'Post';
      case 'user': return 'User';
      case 'memory': return 'Memory';
      case 'event': return 'Event';
      case 'group': return 'Group';
      default: return 'Content';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Brain className="h-10 w-10 text-indigo-500" />
          <div>
            <h1 className="text-4xl font-bold">Neural Search</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find content by thinking about it - no text queries required
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="neural" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Neural Search
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Manual Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="neural" className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Thought-Activated Search</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Our neural interface continuously analyzes your thoughts and emotions to find relevant content before you even type a query.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={triggerManualNeuralAnalysis}
                  disabled={!isNeuralSearchActive}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-analyze
                </Button>
                <Button
                  onClick={() => setIsNeuralSearchActive(!isNeuralSearchActive)}
                  variant={isNeuralSearchActive ? "destructive" : "default"}
                >
                  {isNeuralSearchActive ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                  {isNeuralSearchActive ? 'Listening...' : 'Activate Neural Search'}
                </Button>
              </div>
            </div>

            {!isNeuralSearchActive && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-300">How neural search works</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    When activated, your neural implant sends anonymized thought patterns and emotional states to our search engine. 
                    The AI infers what content might interest you and continuously updates results based on your changing thoughts. 
                    All neural data is end-to-end encrypted and never stored long-term.
                  </p>
                </div>
              </div>
            )}

            {isNeuralSearchActive && searchState.currentThoughtContext && (
              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-purple-800 dark:text-purple-300">Current thought analysis</span>
                </div>
                <p className="text-purple-900 dark:text-purple-200 mb-2">
                  <span className="font-medium">Inferred search query:</span> "{searchState.currentThoughtContext.inferredQuery}"
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-400 mb-4">
                  {searchState.currentThoughtContext.searchIntent}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(searchState.currentThoughtContext.capturedEmotions)
                    .filter(([_, value]) => value > 50)
                    .map(([emotion, value]) => (
                      <Badge key={emotion} variant="secondary" className="bg-purple-100 dark:bg-purple-800">
                        <Heart className="h-3 w-3 mr-1" />
                        {emotion}: {Math.round(value)}%
                      </Badge>
                    ))
                  }
                </div>
                <Button 
                  className="mt-4" 
                  onClick={() => performNeuralSearch(searchState.currentThoughtContext!.inferredQuery)}
                  disabled={searchState.isSearching}
                >
                  {searchState.isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  Search for this
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Traditional Text Search</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Prefer to type your query? Use our standard search interface while still benefiting from neural enhancements that personalize results based on your current state.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your search query..."
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performManualSearch()}
                className="max-w-xl"
              />
              <Button onClick={performManualSearch} disabled={searchState.isSearching}>
                {searchState.isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Search
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Search results */}
      {searchState.searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            Search Results 
            {searchState.lastSearchTime && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (updated at {searchState.lastSearchTime.toLocaleTimeString()})
              </span>
            )}
          </h3>
          
          {searchState.searchResults.map((result) => (
            <Link to={result.url} key={result.id}>
              <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                <div className="flex items-start gap-4">
                  {result.thumbnailUrl && (
                    <img 
                      src={result.thumbnailUrl} 
                      alt="" 
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getTypeIcon(result.type)}
                        {getTypeLabel(result.type)}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {Math.round(result.relevance)}% match
                      </Badge>
                      {result.emotionMatch && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          <Heart className="h-3 w-3 mr-1" />
                          {Math.round(result.emotionMatch)}% emotion match
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {result.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                      {result.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors shrink-0 mt-6" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isNeuralSearchActive && searchState.searchResults.length === 0 && (
        <Card className="p-12 text-center">
          <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Neural search is waiting</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-lg mx-auto">
            Activate neural search to start finding content based on what you're thinking about. Your thoughts are private and encrypted.
          </p>
          <Button onClick={() => setIsNeuralSearchActive(true)}>
            <Brain className="h-4 w-4 mr-2" />
            Start Neural Search
          </Button>
        </Card>
      )}
    </div>
  );
};

export default NeuralSearch;