import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Brain, 
  Edit3, 
  Share2, 
  Save, 
  Sparkles, 
  Lock, 
  Globe, 
  Users,
  Heart,
  Focus,
  AlertCircle,
  RefreshCw,
  Copy,
  Trash2,
  Wand2
} from 'lucide-react';
import { useNeuralState, NeuralState } from '../../hooks/useNeuralState';
import api from '../../lib/api';
import { AINeuralCoCreator } from '../neural-ai-co-creation/AINeuralCoCreator';

interface RawThought {
  id: string;
  rawContent: string;
  capturedEmotions: NeuralState['emotions'];
  capturedFocus: NeuralState['focus'];
  capturedPhysical: NeuralState['physical'];
  capturedAt: Date;
  confidence: number; // How confident the neural capture was (0-100)
}

interface EditedThought {
  refinedContent: string;
  adjustedEmotions: NeuralState['emotions'];
  contextualNotes: string;
  addContext: boolean;
  visibility: 'public' | 'friends' | 'only_me';
  allowComments: boolean;
}

export const ThoughtEditor: React.FC = () => {
  const { addToast } = useToast();
  const { neuralState } = useNeuralState();
  const [rawThoughts, setRawThoughts] = useState<RawThought[]>([]);
  const [selectedThought, setSelectedThought] = useState<RawThought | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editedThought, setEditedThought] = useState<EditedThought | null>(null);
  const [activeTab, setActiveTab] = useState('capture');
  const [showAICoCreator, setShowAICoCreator] = useState(false);

  // Initialize edited thought when a raw thought is selected
  useEffect(() => {
    if (selectedThought) {
      setEditedThought({
        refinedContent: selectedThought.rawContent,
        adjustedEmotions: { ...selectedThought.capturedEmotions },
        contextualNotes: '',
        addContext: true,
        visibility: 'friends',
        allowComments: true,
      });
    }
  }, [selectedThought]);

  // Simulate real-time thought capture
  useEffect(() => {
    if (!isCapturing) return;

    const captureInterval = setInterval(() => {
      const newThought: RawThought = {
        id: Date.now().toString(),
        rawContent: generateRawThoughtContent(),
        capturedEmotions: { ...neuralState.emotions },
        capturedFocus: { ...neuralState.focus },
        capturedPhysical: { ...neuralState.physical },
        capturedAt: new Date(),
        confidence: Math.min(100, Math.max(60, 85 + (Math.random() - 0.5) * 20)),
      };
      
      setRawThoughts(prev => [newThought, ...prev].slice(0, 50)); // Keep last 50 thoughts
      addToast({
        type: 'info',
        message: 'New thought captured!'
      });
    }, 5000); // Capture a thought every 5 seconds when active

    return () => clearInterval(captureInterval);
  }, [isCapturing, neuralState]);

  // Generate simulated raw thought content (would be captured from neural implant in real implementation)
  const generateRawThoughtContent = (): string => {
    const thoughtTemplates = [
      "I'm thinking about that sunset we saw last week... the colors were incredible.",
      "Wait, what was the name of that song playing in the café earlier?",
      "I should reach out to Sarah to check how her project is going.",
      "This new AI tool is really impressive, but I wonder about the privacy implications.",
      "The view from this mountain is breathtaking, I wish everyone could experience this.",
      "I'm feeling a bit anxious about tomorrow's presentation, I need to prepare more.",
      "That new restaurant downtown has amazing reviews, we should go there this weekend.",
      "The way the waves crash against the shore is so calming...",
    ];
    return thoughtTemplates[Math.floor(Math.random() * thoughtTemplates.length)];
  };

  const startCapture = () => setIsCapturing(true);
  const stopCapture = () => setIsCapturing(false);

  const selectThoughtForEditing = (thought: RawThought) => {
    setSelectedThought(thought);
    setActiveTab('edit');
  };

  const updateEmotion = (emotion: keyof NeuralState['emotions'], value: number[]) => {
    if (!editedThought) return;
    setEditedThought({
      ...editedThought,
      adjustedEmotions: {
        ...editedThought.adjustedEmotions,
        [emotion]: value[0],
      },
    });
  };

  const publishThought = async () => {
    if (!selectedThought || !editedThought) return;
    
    setIsPublishing(true);
    try {
      await api.post('/neural/thoughts/publish', {
        rawThoughtId: selectedThought.id,
        ...editedThought,
        originalCaptureTime: selectedThought.capturedAt,
      });
      
      addToast({
        type: 'success',
        message: 'Your thought has been shared successfully!'
      });
      
      // Remove the published thought from the raw list
      setRawThoughts(prev => prev.filter(t => t.id !== selectedThought.id));
      setSelectedThought(null);
      setEditedThought(null);
      setActiveTab('capture');
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to share your thought. Please try again.'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const deleteThought = (thoughtId: string) => {
    setRawThoughts(prev => prev.filter(t => t.id !== thoughtId));
    if (selectedThought?.id === thoughtId) {
      setSelectedThought(null);
      setEditedThought(null);
      setActiveTab('capture');
    }
    addToast({
      type: 'success',
      message: 'Thought deleted'
    });
  };

  const duplicateThought = (thought: RawThought) => {
    const duplicated: RawThought = {
      ...thought,
      id: Date.now().toString(),
      capturedAt: new Date(),
    };
    setRawThoughts(prev => [duplicated, ...prev]);
    addToast({
      type: 'success',
      message: 'Thought duplicated for editing'
    });
  };

  const handleAIPolishedContent = (polishedContent: any) => {
    if (editedThought && selectedThought) {
      setEditedThought({
        ...editedThought,
        refinedContent: polishedContent.refinedContent,
        adjustedEmotions: {
          ...editedThought.adjustedEmotions,
          ...polishedContent.emotionalEnhancements
        },
        contextualNotes: editedThought.contextualNotes + `\n\nAI Suggestions: ${polishedContent.suggestedHashtags.join(', ')}`
      });
      addToast({
        type: 'success',
        message: 'AI refinements applied to your thought!'
      });
    }
  };

  const openAICoCreator = () => {
    if (selectedThought) {
      setShowAICoCreator(true);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Brain className="h-10 w-10 text-purple-500" />
          <div>
            <h1 className="text-4xl font-bold">Thought Editor</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Refine and contextualize your thoughts before sharing to avoid misinterpretation
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
          <TabsTrigger value="capture" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Capture Thoughts
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center gap-2" disabled={!selectedThought}>
            <Edit3 className="h-4 w-4" />
            Edit Thought
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capture" className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Neural Thought Capture</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Capture your thoughts in real-time from your neural implant. All thoughts are private by default until you choose to share them.
                </p>
              </div>
              <Button
                onClick={isCapturing ? stopCapture : startCapture}
                variant={isCapturing ? "destructive" : "default"}
                className="shrink-0"
              >
                {isCapturing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                {isCapturing ? 'Capturing...' : 'Start Capture'}
              </Button>
            </div>

            {!isCapturing && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">Neural capture is paused</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    When active, your thoughts are continuously captured and stored locally on your device. You have full control over which thoughts you share, and all captured data is end-to-end encrypted.
                  </p>
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Captured Thoughts ({rawThoughts.length})</h3>
            
            {rawThoughts.length === 0 ? (
              <Card className="p-12 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No thoughts captured yet</p>
                <Button onClick={startCapture} disabled={isCapturing}>
                  Start capturing thoughts
                </Button>
              </Card>
            ) : (
              rawThoughts.map((thought) => (
                <Card key={thought.id} className="p-6">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(thought.capturedAt).toLocaleTimeString()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          thought.confidence > 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          thought.confidence > 75 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }}>
                          {Math.round(thought.confidence)}% capture confidence
                        </span>
                      </div>
                      <p className="text-lg mb-4">{thought.rawContent}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(thought.capturedEmotions)
                          .filter(([_, value]) => value > 50)
                          .map(([emotion, value]) => (
                            <span key={emotion} className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
                              {emotion}: {Math.round(value)}%
                            </span>
                          ))
                        }
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => duplicateThought(thought)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteThought(thought.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => selectThoughtForEditing(thought)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit & Share
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="edit" className="space-y-6">
          {selectedThought && editedThought ? (
            <>
              <Card className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">Raw Captured Thought</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="italic text-gray-700 dark:text-gray-300">{selectedThought.rawContent}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="refined-content" className="text-lg font-medium mb-2 block">
                      Refined Thought Content
                    </Label>
                    <Textarea
                      id="refined-content"
                      value={editedThought.refinedContent}
                      onChange={(e) => setEditedThought({...editedThought, refinedContent: e.target.value})}
                      className="min-h-[120px] text-lg"
                      placeholder="Refine your thought to make it clearer for others..."
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Edit your thought to add clarity, context, or corrections to the raw neural capture.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="contextual-notes" className="text-lg font-medium mb-2 block">
                      Contextual Notes (Optional)
                    </Label>
                    <Textarea
                      id="contextual-notes"
                      value={editedThought.contextualNotes}
                      onChange={(e) => setEditedThought({...editedThought, contextualNotes: e.target.value})}
                      className="min-h-[80px]"
                      placeholder="Add any additional context that would help others understand your thought better..."
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Adjust Emotional Context
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Fine-tune the emotional metadata associated with your thought to ensure others understand how you actually felt when you had this thought.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Object.entries(editedThought.adjustedEmotions).map(([emotion, value]) => (
                    <div key={emotion} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="capitalize">{emotion}</Label>
                        <span className="text-sm text-gray-500">{Math.round(value)}%</span>
                      </div>
                      <Slider
                        value={[value]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(newValue) => updateEmotion(emotion as keyof NeuralState['emotions'], newValue)}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-blue-500" />
                  Privacy & Sharing Settings
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Visibility</p>
                      <p className="text-sm text-gray-500">Who can see this thought when you share it?</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={editedThought.visibility === 'only_me' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setEditedThought({...editedThought, visibility: 'only_me'})}
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        Only Me
                      </Button>
                      <Button
                        variant={editedThought.visibility === 'friends' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setEditedThought({...editedThought, visibility: 'friends'})}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Friends
                      </Button>
                      <Button
                        variant={editedThought.visibility === 'public' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setEditedThought({...editedThought, visibility: 'public'})}
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        Public
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Allow comments</p>
                      <p className="text-sm text-gray-500">Let others respond to your thought</p>
                    </div>
                    <Switch
                      checked={editedThought.allowComments}
                      onCheckedChange={(checked) => setEditedThought({...editedThought, allowComments: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Add original context</p>
                      <p className="text-sm text-gray-500">Show that this was a raw neural thought that you edited before sharing</p>
                    </div>
                    <Switch
                      checked={editedThought.addContext}
                      onCheckedChange={(checked) => setEditedThought({...editedThought, addContext: checked})}
                    />
                  </div>
                </div>
              </Card>

              <div className="flex justify-end gap-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedThought(null);
                    setEditedThought(null);
                    setActiveTab('capture');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={publishThought} disabled={isPublishing}>
                  {isPublishing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  Publish Thought
                </Button>
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Edit3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Select a thought to edit</p>
              <Button onClick={() => setActiveTab('capture')}>
                Go to capture list
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ThoughtEditor;