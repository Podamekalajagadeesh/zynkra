import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { createStory, setAuthToken, api } from '../lib/api';
import { Button } from './ui/button';
import { X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useIsPremium } from '../hooks/useIsPremium';

interface CustomAudience {
  id: string;
  name: string;
  userIds: string[];
}

interface StoryTemplate {
  id: string;
  name: string;
  defaultElements: { type: string; data: any }[];
  description: string;
}

interface CreateStoryFormProps {
  onClose: () => void;
  onStoryCreated: () => void;
}

// Pre-built story templates
const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: 'story-poll-template',
    name: 'Poll Story',
    description: 'Story with built-in poll',
    defaultElements: [{ type: 'poll', data: { question: '', options: ['', ''] } }]
  },
  {
    id: 'story-quiz-template',
    name: 'Quiz Story',
    description: 'Story with quiz (3 options)',
    defaultElements: [{ type: 'poll', data: { question: 'Quiz: What is your answer?', options: ['Option A', 'Option B', 'Option C'] } }]
  },
  {
    id: 'story-qa-template',
    name: 'Q&A Story',
    description: 'Story with question box for followers',
    defaultElements: [{ type: 'qa', data: { question: 'Ask me anything!' } }]
  },
  {
    id: 'story-countdown-template',
    name: 'Countdown Story',
    description: 'Story with countdown timer',
    defaultElements: [{ type: 'countdown', data: { title: 'Coming Soon', endDate: '' } }]
  },
  {
    id: 'story-mention-template',
    name: 'Mention Story',
    description: 'Story with mention placeholder',
    defaultElements: [{ type: 'mention', data: { username: '' } }]
  }
];

export function CreateStoryForm({ onClose, onStoryCreated }: CreateStoryFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [poll, setPoll] = useState<{ question: string; options: string[] } | null>(null);
  const [mention, setMention] = useState<string | null>(null);
  const [qa, setQa] = useState<{ question: string } | null>(null);
  const [countdown, setCountdown] = useState<{ title: string; endDate: string } | null>(null);
  const [audience, setAudience] = useState('public');
  const [isBoosted, setIsBoosted] = useState(false);
  const [isExtendedDuration, setIsExtendedDuration] = useState(false);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [customAudiences, setCustomAudiences] = useState<CustomAudience[]>([]);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const isPremium = useIsPremium();

  useEffect(() => {
    const fetchCustomAudiences = async () => {
      if (isPremium) {
        try {
          const response = await api.get('/users/me/custom-audiences');
          setCustomAudiences(response.data);
        } catch (error) {
          console.error('Failed to fetch custom audiences:', error);
        }
      }
    };
    fetchCustomAudiences();
  }, [isPremium]);

  const handleSelectTemplate = (template: StoryTemplate) => {
    // Apply template defaults
    template.defaultElements.forEach(element => {
      if (element.type === 'poll') {
        setPoll(element.data);
      } else if (element.type === 'mention') {
        setMention(element.data.username);
      } else if (element.type === 'qa') {
        setQa(element.data);
      } else if (element.type === 'countdown') {
        setCountdown(element.data);
      }
    });
    setIsTemplateLibraryOpen(false);
    addToast(`Template "${template.name}" applied!`, 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const addPoll = () => {
    setPoll({ question: '', options: ['', ''] });
  };

  const handlePollChange = (question: string) => {
    if (poll) {
      setPoll({ ...poll, question });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    if (poll) {
      const newOptions = [...poll.options];
      newOptions[index] = value;
      setPoll({ ...poll, options: newOptions });
    }
  };

  const addOption = () => {
    if (poll && poll.options.length < 5) {
      setPoll({ ...poll, options: [...poll.options, ''] });
    }
  };

  const removeOption = (index: number) => {
    if (poll && poll.options.length > 2) {
      const newOptions = [...poll.options];
      newOptions.splice(index, 1);
      setPoll({ ...poll, options: newOptions });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      const elements = [];
      if (poll && poll.question && poll.options.every((o) => o)) {
        elements.push({
          type: 'poll',
          data: poll,
        });
      }
      if (mention) {
        elements.push({
          type: 'mention',
          data: { username: mention },
        });
      }
      if (qa && qa.question) {
        elements.push({
          type: 'qa',
          data: qa,
        });
      }
      if (countdown && countdown.title && countdown.endDate) {
        elements.push({
          type: 'countdown',
          data: countdown,
        });
      }
      await createStory(file, elements, audience, isBoosted, isExtendedDuration && isPremium);
      onStoryCreated();
      onClose();
    } catch (error) {
      console.error('Failed to create story:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('access_token');
        setAuthToken(null);
        window.dispatchEvent(new Event('authchange'));
        addToast('Your session expired. Please sign in again to post a story.', 'warning');
        onClose();
        navigate('/login');
        return;
      }

      addToast('Failed to create story. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 dark:bg-dark-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Create a Story</h2>
          <div className="flex gap-2 items-center">
            <Button 
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsTemplateLibraryOpen(true)}
            >
              Use Template
            </Button>
            <button type="button" onClick={onClose} className="text-dark-500 dark:text-dark-400">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Story Template Library Modal */}
        {isTemplateLibraryOpen && (
          <div className="absolute inset-0 bg-black/95 z-50 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Story Templates</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {STORY_TEMPLATES.map(template => (
                <div key={template.id} className="p-4 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{template.name}</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">{template.description}</p>
                  </div>
                  <Button onClick={() => handleSelectTemplate(template)}>Apply</Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setIsTemplateLibraryOpen(false)}>Close</Button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="story-file" className="block text-sm font-medium text-dark-700 dark:text-light-100 mb-2">
              Upload Image or Video
            </label>
            <input
              id="story-file"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-dark-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-300 dark:hover:file:bg-primary-900/40"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="story-audience" className="block text-sm font-medium text-dark-700 dark:text-light-100 mb-2">
              Share with
            </label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger id="story-audience">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="close_friends">Close Friends</SelectItem>
                {isPremium && customAudiences.map(audience => (
                  <SelectItem key={audience.id} value={`custom_${audience.id}`}>
                    {audience.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="boost-story"
              checked={isBoosted}
              onChange={(e) => setIsBoosted(e.target.checked)}
              className="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600"
            />
            <label htmlFor="boost-story" className="text-sm font-medium text-dark-700 dark:text-light-100">
              Boost story (Premium feature) - Place your story at the top of friends' feeds
            </label>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="extended-story-duration"
              checked={isExtendedDuration}
              onChange={(e) => setIsExtendedDuration(e.target.checked)}
              disabled={!isPremium}
              className="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 disabled:opacity-50"
            />
            <label htmlFor="extended-story-duration" className="text-sm font-medium text-dark-700 dark:text-light-100">
              48-hour Story duration (Premium feature) - Double the standard 24-hour window
              {!isPremium && " - Upgrade to premium to enable"}
            </label>
          </div>

          {!poll && (
            <Button type="button" onClick={addPoll} variant="secondary" size="sm" className="mb-4">
              Add Poll
            </Button>
          )}

          {!mention && (
            <Button type="button" onClick={() => setMention('')} variant="secondary" size="sm" className="mb-4 ml-2">
              Add Mention
            </Button>
          )}

          {poll && (
            <div className="mb-4 space-y-2">
              <input
                type="text"
                placeholder="Poll Question"
                value={poll.question}
                onChange={(e) => handlePollChange(e.target.value)}
                className="w-full rounded-md border-dark-300 bg-dark-100 p-2 dark:border-dark-600 dark:bg-dark-700"
              />
              {poll.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full rounded-md border-dark-300 bg-dark-100 p-2 dark:border-dark-600 dark:bg-dark-700"
                  />
                  {poll.options.length > 2 && (
                    <Button type="button" onClick={() => removeOption(index)} variant="ghost" size="icon">
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))}
              {poll.options.length < 5 && (
                <Button type="button" onClick={addOption} variant="secondary" size="sm">
                  <Plus size={16} className="mr-2" />
                  Add Option
                </Button>
              )}
            </div>
          )}

          {mention !== null && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Username to mention"
                value={mention}
                onChange={(e) => setMention(e.target.value)}
                className="w-full rounded-md border-dark-300 bg-dark-100 p-2 dark:border-dark-600 dark:bg-dark-700"
              />
            </div>
          )}

          <Button type="submit" variant="primary" disabled={!file || isUploading}>
            {isUploading ? 'Uploading...' : 'Post Story'}
          </Button>
        </form>
      </div>
    </div>
  );
}