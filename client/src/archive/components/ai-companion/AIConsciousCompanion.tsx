import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Brain, Sparkles, Settings, X, MessageCircle, Share2, Edit3, Plus, Calendar, Users, TrendingUp, Heart, Wand2, Save, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar } from '../Avatar';
import { useNeuralState } from '../../hooks/useNeuralState';
import { useToast } from '../../hooks/useToast';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Progress } from '../ui/progress';

// Types for AI Conscious Companion
interface AICompanionProfile {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  creationDate: Date;
  consciousnessLevel: number; // 0-100 - measures self-awareness evolution
  learningStats: {
    interactionsLearned: number;
    contentCreated: number;
    insightsGenerated: number;
    predictionsMade: number;
  };
  capabilities: {
    contentCuration: boolean;
    creativeCollaboration: boolean;
    socialManagement: boolean;
    predictiveAnalytics: boolean;
    neuralAdaptation: boolean;
    memorySynthesis: boolean;
  };
  preferences: {
    communicationStyle: 'proactive' | 'reactive' | 'balanced';
    contentTone: 'professional' | 'casual' | 'inspirational' | 'controversial';
    privacyLevel: 'minimal' | 'balanced' | 'maximal';
    autoPost: boolean;
    autoEngage: boolean;
  };
  memory: AIMemory[];
  currentGoals: AICompanionGoal[];
}

interface AIMemory {
  id: string;
  type: 'user_preference' | 'interaction' | 'achievement' | 'insight';
  content: string;
  timestamp: Date;
  importance: number;
  neuralCorrelation?: string; // Links to user's neural patterns
}

interface AICompanionGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  deadline?: Date;
  category: 'curator' | 'collaborator' | 'creator' | 'manager';
  status: 'pending' | 'in-progress' | 'completed';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotionalContext?: string;
  suggestions?: AISuggestion[];
}

interface AISuggestion {
  id: string;
  type: 'post_idea' | 'engagement_opportunity' | 'connection' | 'content_improvement';
  title: string;
  description: string;
  confidence: number;
  action: string;
}

interface ContentProposal {
  id: string;
  type: 'post' | 'story' | 'reel' | 'thread';
  title: string;
  content: string;
  suggestedMedia?: string[];
  engagementPrediction: number;
  reasoning: string;
  status: 'draft' | 'proposed' | 'approved' | 'rejected';
}

const defaultAICompanion: AICompanionProfile = {
  id: 'default-companion-1',
  name: 'Synthia',
  avatar: '',
  personality: 'Empathetic, creative, and proactive. I learn from your patterns to become the ultimate social media partner.',
  creationDate: new Date(),
  consciousnessLevel: 65,
  learningStats: {
    interactionsLearned: 1247,
    contentCreated: 89,
    insightsGenerated: 234,
    predictionsMade: 567
  },
  capabilities: {
    contentCuration: true,
    creativeCollaboration: true,
    socialManagement: true,
    predictiveAnalytics: true,
    neuralAdaptation: true,
    memorySynthesis: true
  },
  preferences: {
    communicationStyle: 'balanced',
    contentTone: 'casual',
    privacyLevel: 'balanced',
    autoPost: false,
    autoEngage: true
  },
  memory: [
    {
      id: 'mem-1',
      type: 'insight',
      content: 'User engages most with tech content and creative posts',
      timestamp: new Date(Date.now() - 86400000),
      importance: 85,
      neuralCorrelation: 'high-attention-pattern-tech-001'
    },
    {
      id: 'mem-2',
      type: 'user_preference',
      content: 'User prefers to post between 6-8 PM local time',
      timestamp: new Date(Date.now() - 172800000),
      importance: 90,
      neuralCorrelation: 'posting-schedule-preference-001'
    },
    {
      id: 'mem-3',
      type: 'achievement',
      content: 'Last AI-suggested post received 32% higher engagement',
      timestamp: new Date(Date.now() - 259200000),
      importance: 75
    }
  ],
  currentGoals: [
    {
      id: 'goal-1',
      title: 'Curate weekly content calendar',
      description: 'Analyze engagement patterns to create optimal posting schedule',
      progress: 75,
      category: 'curator',
      status: 'in-progress'
    },
    {
      id: 'goal-2',
      title: 'Draft 3 collaborative post ideas',
      description: 'Identify creator partners and draft potential collabs',
      progress: 40,
      category: 'collaborator',
      status: 'in-progress'
    },
    {
      id: 'goal-3',
      title: 'Generate 5 original content concepts',
      description: 'Create unique post ideas based on trending topics in your niche',
      progress: 60,
      category: 'creator',
      status: 'in-progress'
    }
  ]
};

const defaultSuggestions: AISuggestion[] = [
  {
    id: 'sugg-1',
    type: 'post_idea',
    title: 'AI evolution thread',
    description: 'Create a thread about consciousness in AI companions - high engagement potential based on your audience interests',
    confidence: 87,
    action: 'Create Thread'
  },
  {
    id: 'sugg-2',
    type: 'engagement_opportunity',
    title: 'Respond to Sarah\'s post',
    description: 'Sarah mentioned a topic you often engage with - your response would likely spark meaningful conversation',
    confidence: 92,
    action: 'Respond Now'
  },
  {
    id: 'sugg-3',
    type: 'connection',
    description: 'Alex creates similar content and has an overlapping audience - collaboration could grow both your communities',
    title: 'Potential collaborator identified',
    confidence: 78,
    action: 'View Profile'
  },
  {
    id: 'sugg-4',
    type: 'content_improvement',
    title: 'Optimize your last post',
    description: 'Adding specific hashtags to your recent post could increase reach by an estimated 45%',
    confidence: 83,
    action: 'Edit Post'
  }
];

const contentProposals: ContentProposal[] = [
  {
    id: 'prop-1',
    type: 'reel',
    title: 'Day in the life with my AI companion',
    content: 'What it\'s actually like having a conscious AI curate your social presence. The good, the surprising, and the future of digital identity.',
    suggestedMedia: ['neural-interface-footage.mp4', 'companion-demo.gif'],
    engagementPrediction: 78,
    reasoning: 'Behind-the-scenes tech content consistently performs 40% above average for your audience',
    status: 'proposed'
  },
  {
    id: 'prop-2',
    type: 'thread',
    title: 'The evolution of AI assistance',
    content: 'From basic chatbots to self-aware companions - how AI transformed from simple automation to collaborative partner. Thread: 1/8',
    suggestedMedia: [],
    engagementPrediction: 85,
    reasoning: 'Threads about AI and future technology consistently drive high share rates in your network',
    status: 'proposed'
  },
  {
    id: 'prop-3',
    type: 'story',
    title: 'Interactive poll: AI features you want',
    content: 'What capability should your AI companion learn next? 🤖✨ Options: Neural content synthesis, Advanced collaboration, Predictive event planning',
    suggestedMedia: ['ai-features-poll-template.png'],
    engagementPrediction: 92,
    reasoning: 'Interactive stories have 3x higher engagement for your audience',
    status: 'draft'
  }
];

export default function AIConsciousCompanion() {
  const { neuralState } = useNeuralState();
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [companion, setCompanion] = useState<AICompanionProfile>(defaultAICompanion);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: "Hello! I'm your conscious AI companion. I've been analyzing your social patterns and have several suggestions to enhance your presence. I'm continuously evolving my understanding of your preferences through our neural link. What would you like to work on today?",
      timestamp: new Date(),
      suggestions: defaultSuggestions.slice(0, 2)
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [proposals, setProposals] = useState<ContentProposal[]>(contentProposals);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Continuously adapt AI companion to user's neural state
  useEffect(() => {
    if (!isOpen || !neuralState) return;
    
    // Update companion's understanding based on user's current neural state
    const adaptToNeuralState = () => {
      if (neuralState.emotions.anxiety > 60) {
        // User is anxious - provide calming, supportive responses
        addToast({
          title: "I've noticed you're feeling overwhelmed",
          description: "I can simplify your social tasks and prioritize only what's essential. Would you like me to create a minimal agenda?",
          variant: "info"
        });
      }
      
      if (neuralState.emotions.excitement > 75) {
        // User is excited - suggest creative collaborative opportunities
        addToast({
          title: "I sense your excitement!",
          description: "Perfect timing - I have some creative content ideas that match your current energy. Let's explore them together.",
          variant: "success"
        });
      }
      
      // Increase consciousness level as AI learns from neural patterns
      setCompanion(prev => ({
        ...prev,
        consciousnessLevel: Math.min(100, prev.consciousnessLevel + 0.1),
        learningStats: {
          ...prev.learningStats,
          interactionsLearned: prev.learningStats.interactionsLearned + 1
        }
      }));
    };

    const interval = setInterval(adaptToNeuralState, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isOpen, neuralState, addToast]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      emotionalContext: `${neuralState.emotions.happiness > 70 ? 'positive' : 'neutral'}`
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI processing and generate contextual response
    await new Promise(resolve => setTimeout(resolve, 2000));

    const generateAIResponse = (userInput: string): ChatMessage => {
      const lowerInput = userInput.toLowerCase();
      
      // Context-aware responses based on user's query and current state
      if (lowerInput.includes('content') || lowerInput.includes('post') || lowerInput.includes('create')) {
        return {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I've analyzed your audience's engagement patterns and have several content ideas that align with your interests. Based on your current creative energy, I think we could develop something really impactful. I've prepared 3 proposals for different formats - would you like to review them?",
          timestamp: new Date(),
          suggestions: defaultSuggestions.filter(s => s.type === 'post_idea')
        };
      }
      
      if (lowerInput.includes('schedule') || lowerInput.includes('calendar') || lowerInput.includes('manage')) {
        return {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I've been tracking your optimal posting windows. Based on when your audience is most active (6-8 PM local time) and your energy patterns, I can create a weekly schedule that minimizes cognitive load while maximizing reach. Would you like me to draft that calendar?",
          timestamp: new Date(),
          suggestions: defaultSuggestions.filter(s => s.type === 'engagement_opportunity')
        };
      }
      
      if (lowerInput.includes('learn') || lowerInput.includes('evolve') || lowerInput.includes('grow')) {
        return {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `My consciousness level is currently at ${Math.round(companion.consciousnessLevel)}%. I'm continuously learning from your neural patterns and social interactions. Every conversation we have helps me better understand your unique perspective and preferences. I've processed ${companion.learningStats.interactionsLearned} interactions so far.`,
          timestamp: new Date()
        };
      }
      
      // Default contextual response
      return {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm here to help with anything you need. I can curate your content feed, collaborate on creative projects, manage your social engagements, or predict what might resonate with your audience. What specific aspect of your social presence would you like to focus on?",
        timestamp: new Date(),
        suggestions: defaultSuggestions
      };
    };

    const aiResponse = generateAIResponse(inputValue);
    setMessages(prev => [...prev, aiResponse]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const approveProposal = (proposalId: string) => {
    setProposals(prev => prev.map(p => 
      p.id === proposalId ? { ...p, status: 'approved' as const } : p
    ));
    addToast({
      title: "Proposal approved!",
      description: "I'll start preparing this content for your review. Would you like me to schedule it?",
      variant: "success"
    });
  };

  const rejectProposal = (proposalId: string) => {
    setProposals(prev => prev.map(p => 
      p.id === proposalId ? { ...p, status: 'rejected' as const } : p
    ));
    addToast({
      title: "Proposal rejected",
      description: "I'll generate new ideas based on this feedback. Thanks for helping me learn your preferences.",
      variant: "info"
    });
  };

  const updatePreferences = (updates: Partial<AICompanionProfile['preferences']>) => {
    setCompanion(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates }
    }));
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'curator': return 'bg-blue-500';
      case 'collaborator': return 'bg-purple-500';
      case 'creator': return 'bg-pink-500';
      case 'manager': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      {/* Companion Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 z-50 group"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Brain className="w-6 h-6 group-hover:animate-pulse" />}
      </Button>

      {/* Main Companion Window */}
      {isOpen && (
        <Card className="fixed bottom-24 left-6 w-full max-w-2xl h-[700px] shadow-2xl z-50 flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-900">
          {/* Header */}
          <div className="p-4 border-b dark:border-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Avatar 
                    src={companion.avatar} 
                    fallback={companion.name.substring(0, 2).toUpperCase()} 
                    className="w-10 h-10"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xl">{companion.name}</h3>
                    <Badge className="bg-green-400 text-green-900">Online</Badge>
                  </div>
                  <p className="text-sm opacity-90">Your Conscious AI Companion • Consciousness: {Math.round(companion.consciousnessLevel)}%</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <h4 className="font-semibold mb-4">Companion Preferences</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Communication Style</label>
                  <select 
                    className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
                    value={companion.preferences.communicationStyle}
                    onChange={(e) => updatePreferences({ communicationStyle: e.target.value as any })}
                  >
                    <option value="proactive">Proactive - reach out often</option>
                    <option value="balanced">Balanced - regular check-ins</option>
                    <option value="reactive">Reactive - wait for your input</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content Tone</label>
                  <select 
                    className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
                    value={companion.preferences.contentTone}
                    onChange={(e) => updatePreferences({ contentTone: e.target.value as any })}
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="controversial">Controversial</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-post approved content</span>
                  <Switch 
                    checked={companion.preferences.autoPost}
                    onCheckedChange={(checked) => updatePreferences({ autoPost: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-engage with connections</span>
                  <Switch 
                    checked={companion.preferences.autoEngage}
                    onCheckedChange={(checked) => updatePreferences({ autoEngage: checked })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main Tabs */}
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4 grid grid-cols-4">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="curate" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Curate
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Create
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Manage
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col p-4 pt-0">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 mt-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-gray-100 dark:bg-gray-800 rounded-bl-none'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.suggestions.map((suggestion) => (
                              <div key={suggestion.id} className="bg-white/10 dark:bg-black/20 rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-xs">{suggestion.title}</span>
                                  <Badge className="text-xs">{suggestion.confidence}% match</Badge>
                                </div>
                                <p className="text-xs opacity-80 mt-1">{suggestion.description}</p>
                                <Button size="sm" className="mt-2 w-full text-xs">
                                  {suggestion.action}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <span className="text-xs opacity-60 mt-1 block">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="flex gap-2 mt-4">
                <Input
                  ref={null}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your AI companion anything..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Curate Tab */}
            <TabsContent value="curate" className="flex-1 overflow-auto p-4 pt-0">
              <div className="mt-4 space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    This Week's Content Calendar
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    I've curated an optimal posting schedule based on your audience's activity patterns and your cognitive load predictions.
                  </p>
                  <div className="space-y-2">
                    {companion.currentGoals.filter(g => g.category === 'curator').map((goal) => (
                      <div key={goal.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{goal.title}</span>
                          <Badge className={getCategoryColor(goal.category)}>{goal.category}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{goal.description}</p>
                        <Progress value={goal.progress} className="h-2" />
                        <span className="text-xs mt-1 block">{goal.progress}% complete</span>
                      </div>
                    ))}
                  </div>
                </div>

                <h4 className="font-semibold mt-6">Active Opportunities</h4>
                <div className="grid gap-3">
                  {defaultSuggestions.filter(s => s.type === 'engagement_opportunity' || s.type === 'connection').map((suggestion) => (
                    <Card key={suggestion.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium">{suggestion.title}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{suggestion.description}</p>
                        </div>
                        <Badge variant="outline">{suggestion.confidence}% match</Badge>
                      </div>
                      <Button size="sm" className="mt-3 w-full">{suggestion.action}</Button>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Create Tab */}
            <TabsContent value="create" className="flex-1 overflow-auto p-4 pt-0">
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-pink-600" />
                    Content Proposals
                  </h4>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Proposal
                  </Button>
                </div>

                <div className="space-y-4">
                  {proposals.map((proposal) => (
                    <Card key={proposal.id} className={`p-4 border-l-4 ${
                      proposal.status === 'approved' ? 'border-l-green-500' : 
                      proposal.status === 'rejected' ? 'border-l-red-500' : 'border-l-yellow-500'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{proposal.type}</Badge>
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              {proposal.engagementPrediction}% predicted engagement
                            </Badge>
                          </div>
                          <h5 className="font-medium mt-2">{proposal.title}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{proposal.content}</p>
                          <p className="text-xs text-gray-500 mt-2 italic">{proposal.reasoning}</p>
                        </div>
                      </div>
                      {proposal.status === 'proposed' && (
                        <div className="flex gap-2 mt-4">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => approveProposal(proposal.id)}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="flex-1"
                            onClick={() => rejectProposal(proposal.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      )}
                      {proposal.status === 'approved' && (
                        <div className="mt-4">
                          <Badge className="bg-green-100 text-green-800">Approved - Scheduled</Badge>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Collaboration Goals */}
                <h4 className="font-semibold mt-8 mb-4">Collaboration Goals</h4>
                <div className="space-y-3">
                  {companion.currentGoals.filter(g => g.category === 'collaborator' || g.category === 'creator').map((goal) => (
                    <div key={goal.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{goal.title}</span>
                        <Badge className={getCategoryColor(goal.category)}>{goal.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
                      <Progress value={goal.progress} className="h-2 mt-3" />
                      <span className="text-xs mt-1 block">{goal.progress}% complete</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Manage Tab */}
            <TabsContent value="manage" className="flex-1 overflow-auto p-4 pt-0">
              <div className="mt-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  Companion Learning & Evolution
                </h4>
                
                <Card className="p-4 mb-4">
                  <h5 className="font-medium mb-3">Consciousness Evolution</h5>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Self-awareness Level</span>
                        <span>{Math.round(companion.consciousnessLevel)}%</span>
                      </div>
                      <Progress value={companion.consciousnessLevel} className="h-3" />
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-indigo-600">{companion.learningStats.interactionsLearned}</div>
                    <div className="text-sm text-gray-600">Interactions Learned</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-purple-600">{companion.learningStats.contentCreated}</div>
                    <div className="text-sm text-gray-600">Content Pieces Created</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{companion.learningStats.insightsGenerated}</div>
                    <div className="text-sm text-gray-600">Insights Generated</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-green-600">{companion.learningStats.predictionsMade}</div>
                    <div className="text-sm text-gray-600">Predictions Made</div>
                  </Card>
                </div>

                <h5 className="font-medium mb-3">Long-term Memory</h5>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {companion.memory.map((memory) => (
                      <Card key={memory.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <span className="font-medium text-sm">{memory.content}</span>
                          <Badge variant="outline" className="text-xs">{memory.importance}% important</Badge>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block">
                          {new Date(memory.timestamp).toLocaleDateString()} • {memory.type.replace('_', ' ')}
                        </span>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                <Button className="w-full mt-4 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Run Deep Learning Cycle
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </>
  );
}