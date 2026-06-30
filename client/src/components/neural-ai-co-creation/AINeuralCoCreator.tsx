import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Sparkles,
  Brain,
  RefreshCw,
  Heart,
  Users,
  Loader2,
  Wand2,
  Lightbulb,
  TrendingUp,
  Copy,
  Check,
  MessageSquare,
  X,
  Edit3
} from 'lucide-react';
import { useNeuralState, NeuralState } from '../../hooks/useNeuralState';
import api from '../../lib/api';

interface NeuralContent {
  id: string;
  type: 'thought' | 'memory';
  rawContent: string;
  capturedEmotions: NeuralState['emotions'];
  capturedAt: Date;
  isMemory?: boolean;
  sensoryData?: any;
}

interface AIPolishedContent {
  refinedContent: string;
  suggestedHashtags: string[];
  audienceInsights: string;
  engagementTips: string[];
  emotionalEnhancements: Partial<NeuralState['emotions']>;
  contextualAdditions: string;
  suggestedTitle: string;
}

interface AINeuralCoCreatorProps {
  neuralContent: NeuralContent;
  onContentPolished: (polished: AIPolishedContent) => void;
  onClose: () => void;
}

export const AINeuralCoCreator: React.FC<AINeuralCoCreatorProps> = ({
  neuralContent,
  onContentPolished,
  onClose
}) => {
  const { addToast } = useToast();
  const { neuralState } = useNeuralState();
  const [isGenerating, setIsGenerating] = useState(false);
  const [polishedContent, setPolishedContent] = useState<AIPolishedContent | null>(null);
  const [activeTab, setActiveTab] = useState('refine');
  const [audienceFocus, setAudienceFocus] = useState<'general' | 'friends' | 'followers' | 'professional'>('general');
  const [tonePreference, setTonePreference] = useState<'authentic' | 'polished' | 'humorous' | 'inspirational'>('authentic');

  const generateAIPolishing = async () => {
    setIsGenerating(true);
    try {
      // In a real implementation, this would call an actual AI API
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate AI processing of the raw neural content
      const polished: AIPolishedContent = generateAISuggestions(neuralContent, audienceFocus, tonePreference);
      setPolishedContent(polished);
      
      addToast({
        type: 'success',
        message: 'AI has refined your neural content!'
      });
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to generate AI suggestions. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAISuggestions = (
    content: NeuralContent,
    audience: string,
    tone: string
  ): AIPolishedContent => {
    // This simulates what an actual AI model would generate based on the raw thought/memory
    const baseRefinements: Record<string, string> = {
      "I'm thinking about that sunset we saw last week... the colors were incredible.": 
        "That sunset last week was absolutely magical - the way the oranges, pinks, and purples painted the sky across the horizon was something I'll never forget. Sharing this moment with you made it even more special.",
      "Wait, what was the name of that song playing in the café earlier?":
        "Heard this incredible track at the café today - can anyone help me identify it? The vibe was perfect, something I need to add to my playlist immediately!",
      "I should reach out to Sarah to check how her project is going.":
        "Been thinking about Sarah and that big project she's been working on. If you see this Sarah, I'd love to catch up and hear how it's going - I'm rooting for you!",
      "This new AI tool is really impressive, but I wonder about the privacy implications.":
        "Just tested out this groundbreaking new AI tool - the capabilities are mind-blowing! But I'm also thinking deeply about the privacy considerations that come with this technology. What are your thoughts?",
      "The view from this mountain is breathtaking, I wish everyone could experience this.":
        "Standing at the summit of this mountain, the view stretches out endlessly in every direction. There's something about being at the top that puts everything in perspective. Everyone needs to experience this feeling at least once.",
      "I'm feeling a bit anxious about tomorrow's presentation, I need to prepare more.":
        "Got a big presentation tomorrow and I'm putting in the final hours of preparation. Feeling a bit nervous but excited to share what I've been working on. Send good vibes my way!",
      "That new restaurant downtown has amazing reviews, we should go there this weekend.":
        "Scouted out this incredible new restaurant downtown - the reviews are through the roof! Who wants to join me this weekend to check it out?",
      "The way the waves crash against the shore is so calming...":
        "There's nothing quite like the sound of waves crashing against the shore. It's the ultimate reset button for a busy mind. Could stay here forever."
    };

    const defaultRefinement = `Refined version of: "${content.rawContent.slice(0, 100)}..." - This AI-enhanced version adds context, emotional depth, and engagement optimization to help your thought resonate better with your audience.`;

    const suggestedHashtags = [
      '#neuralsharing',
      '#mindfulness',
      '#sharedexperiences',
      '#consciousconnections'
    ];

    const audienceInsights = `Your content will resonate best with ${audience === 'professional' ? 'colleagues and industry peers' : audience === 'friends' ? 'your close circle of friends' : 'your broader follower base'}. The ${tone} tone you've selected aligns well with typical engagement patterns in your network.`;

    const engagementTips = [
      'Add relevant location tags to increase discoverability',
      'Ask a question in your caption to encourage comments',
      'Pin this post to your profile for maximum visibility',
      'Share to your stories to boost initial engagement'
    ];

    return {
      refinedContent: baseRefinements[content.rawContent] || defaultRefinement,
      suggestedHashtags,
      audienceInsights,
      engagementTips,
      emotionalEnhancements: {
        ...content.capturedEmotions,
        joy: Math.min(100, content.capturedEmotions.joy + 10)
      },
      contextualAdditions: 'AI suggests adding when and where this moment occurred to help your audience connect better with your experience.',
      suggestedTitle: content.type === 'memory' ? 'A Moment to Remember' : 'Thought I Wanted to Share'
    };
  };

  const applyPolishedContent = () => {
    if (polishedContent) {
      onContentPolished(polishedContent);
      addToast({
        type: 'success',
        message: 'AI-polished content applied successfully!'
      });
      onClose();
    }
  };

  const regenerateWithPreferences = () => {
    generateAIPolishing();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Neural Co-Creator</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI helps you refine and share your {neuralContent.type}s with your audience
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Original content section */}
          <div className="mb-8">
            <Card className="p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold">Your Raw {neuralContent.type === 'thought' ? 'Thought' : 'Memory'}</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">{neuralContent.rawContent}</p>
            </Card>
          </div>

          {/* Preferences section */}
          {!polishedContent && (
            <div className="mb-8 space-y-6">
              <h3 className="text-lg font-semibold">Customize your AI refinement</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> Target Audience
                  </Label>
                  <select 
                    value={audienceFocus}
                    onChange={(e) => setAudienceFocus(e.target.value as any)}
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="general">General Audience</option>
                    <option value="friends">Close Friends Only</option>
                    <option value="followers">All Followers</option>
                    <option value="professional">Professional Network</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Content Tone
                  </Label>
                  <select 
                    value={tonePreference}
                    onChange={(e) => setTonePreference(e.target.value as any)}
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="authentic">Keep it Authentic</option>
                    <option value="polished">Polished & Professional</option>
                    <option value="humorous">Add Some Humor</option>
                    <option value="inspirational">Make it Inspirational</option>
                  </select>
                </div>
              </div>

              <Button 
                onClick={generateAIPolishing}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI is refining your {neuralContent.type}...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate AI Refinements
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Polished content results */}
          {polishedContent && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="refine" className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Refined Content
                </TabsTrigger>
                <TabsTrigger value="enhance" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Engagement Tips
                </TabsTrigger>
                <TabsTrigger value="emotions" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Emotional Context
                </TabsTrigger>
                <TabsTrigger value="context" className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> AI Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="refine" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">AI-Refined Content</h3>
                  <Textarea
                    value={polishedContent.refinedContent}
                    onChange={(e) => setPolishedContent({
                      ...polishedContent,
                      refinedContent: e.target.value
                    })}
                    className="min-h-[150px] text-base"
                  />
                  
                  <div className="space-y-2">
                    <Label>Suggested Hashtags</Label>
                    <div className="flex flex-wrap gap-2">
                      {polishedContent.suggestedHashtags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="enhance" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">AI Engagement Recommendations</h3>
                  <ul className="space-y-3">
                    {polishedContent.engagementTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Check className="w-5 h-5 text-green-500 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="emotions" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">AI-Enhanced Emotional Context</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(polishedContent.emotionalEnhancements).map(([emotion, value]) => (
                      <div key={emotion} className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="capitalize">{emotion}</Label>
                          <span className="text-sm text-gray-500">{value}%</span>
                        </div>
                        <Slider
                          value={[value as number]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={([newValue]) => setPolishedContent({
                            ...polishedContent,
                            emotionalEnhancements: {
                              ...polishedContent.emotionalEnhancements,
                              [emotion]: newValue
                            }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="context" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">AI Audience Insights</h3>
                  <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
                    <p className="text-gray-800 dark:text-gray-200">{polishedContent.audienceInsights}</p>
                  </Card>

                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Contextual Additions</h4>
                    <p className="text-gray-600 dark:text-gray-400">{polishedContent.contextualAdditions}</p>
                  </div>
                </div>
              </TabsContent>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  variant="secondary"
                  onClick={regenerateWithPreferences}
                  disabled={isGenerating}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                <Button
                  onClick={applyPolishedContent}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply AI Refinements
                </Button>
              </div>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};