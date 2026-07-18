import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Upload, X, Sparkles } from 'lucide-react';
import type { MemoryMetadata, SensoryData, RealityContext } from '../../lib/types';
import api, { createMemory } from '../../lib/api';
import { AICoPilotPanel } from '../ai-copilot/AICoPilotPanel';
import type { ContentSuggestion } from '../ai-copilot/AICoPilotPanel';

interface CreateMemoryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateMemoryForm: React.FC<CreateMemoryFormProps> = ({ onSuccess, onCancel }) => {
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'friends' | 'public' | 'only_me'>('friends');
  const [sensoryData, setSensoryData] = useState<SensoryData>({});
  const [allowReplay, setAllowReplay] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [isTimeCapsule, setIsTimeCapsule] = useState(false);
  const [unlockAt, setUnlockAt] = useState('');
  const [recipientIds, setRecipientIds] = useState('');
  const [timeCapsuleMessage, setTimeCapsuleMessage] = useState('');
  const [realityContext, setRealityContext] = useState<RealityContext>('neural');
  const [emotions, setEmotions] = useState({
    joy: 50,
    sadness: 0,
    excitement: 70,
    calm: 30,
    anger: 0,
    surprise: 20,
    love: 60,
    fear: 0,
  });
  
  // AI Co-Pilot state
  const [isAICoPilotOpen, setIsAICoPilotOpen] = useState(false);
  
  const handleAISuggestionApply = (suggestion: ContentSuggestion) => {
    setContent(suggestion.content);
    // Apply emotional context if available
    if (suggestion.emotionalContext) {
      setEmotions(prev => ({
        ...prev,
        ...suggestion.emotionalContext
      }));
    }
    addToast({ type: 'success', message: `Applied suggestion: ${suggestion.title}` });
    setIsAICoPilotOpen(false);
  };

  const handleFileUpload = async (type: keyof SensoryData, files: FileList) => {
    setIsUploading(true);
    try {
      const uploadedFiles = await Promise.all(
        Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const response = await api.post('/memories/upload', formData);
          return { url: response.data.url, type: file.type };
        })
      );
      setSensoryData((prev) => ({
        ...prev,
        [type]: [...(prev[type] || []), ...uploadedFiles],
      }));
      addToast({ type: 'success', message: 'Files uploaded successfully' });
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to upload files' });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (type: keyof SensoryData, index: number) => {
    setSensoryData((prev) => ({
      ...prev,
      [type]: prev[type]?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const memoryMetadata: MemoryMetadata = {
        emotions,
        context: {
          timestamp: new Date().toISOString(),
          location: locationName ? { name: locationName, latitude: 0, longitude: 0 } : undefined,
        },
        sensory: sensoryData,
        neuralTimestamp: new Date().toISOString(),
        privacySettings: {
          allowReplay,
          allowDownload,
        },
      };

      await createMemory({
        content,
        visibility,
        memoryMetadata,
        realityContext,
        timeCapsuleUnlockAt: isTimeCapsule ? unlockAt || undefined : undefined,
        timeCapsuleRecipients: recipientIds
          .split(',')
          .map((recipientId) => recipientId.trim())
          .filter(Boolean),
        timeCapsuleMessage: timeCapsuleMessage || undefined,
      });

      addToast({ type: 'success', message: 'Memory shared successfully!' });
      onSuccess?.();
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to share memory' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Share a Memory</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload and share your personal memories with full sensory context
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Memory Description</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe this memory..."
          className="min-h-[100px]"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location (where this memory happened)</Label>
        <Input
          id="location"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="e.g., Paris, France - Eiffel Tower"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visual media upload */}
        <div className="space-y-3 p-4 border rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="text-2xl">👁️</span> What you saw (Visual)
          </h3>
          <Input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => e.target.files && handleFileUpload('visual', e.target.files)}
            disabled={isUploading}
          />
          {sensoryData.visual?.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <span className="text-sm truncate">{file.url.split('/').pop()}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeFile('visual', i)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Audio upload */}
        <div className="space-y-3 p-4 border rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="text-2xl">👂</span> What you heard (Audio)
          </h3>
          <Input
            type="file"
            multiple
            accept="audio/*"
            onChange={(e) => e.target.files && handleFileUpload('audio', e.target.files)}
            disabled={isUploading}
          />
          {sensoryData.audio?.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <span className="text-sm truncate">{file.url.split('/').pop()}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeFile('audio', i)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Emotional Context (How you felt)</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(emotions).map(([emotion, value]) => (
            <div key={emotion} className="space-y-2">
              <div className="flex justify-between">
                <Label className="capitalize">{emotion}</Label>
                <span className="text-sm text-gray-500">{value}%</span>
              </div>
              <Slider
                value={[value]}
                min={0}
                max={100}
                step={1}
                onValueChange={([newValue]) => setEmotions((prev) => ({ ...prev, [emotion]: newValue }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Privacy Settings</h3>
        <div className="flex items-center justify-between">
          <div>
            <Label>Allow replay</Label>
            <p className="text-sm text-gray-500">Let others replay this memory's full sensory experience</p>
          </div>
          <Switch checked={allowReplay} onCheckedChange={setAllowReplay} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Allow download</Label>
            <p className="text-sm text-gray-500">Let others download this memory's files</p>
          </div>
          <Switch checked={allowDownload} onCheckedChange={setAllowDownload} />
        </div>
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">Time Capsule</h3>
            <p className="text-sm text-gray-500">Schedule this memory to unlock automatically for your connections later.</p>
          </div>
          <Switch checked={isTimeCapsule} onCheckedChange={setIsTimeCapsule} />
        </div>
        {isTimeCapsule && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unlockAt">Unlock date and time</Label>
                <Input id="unlockAt" type="datetime-local" value={unlockAt} onChange={(e) => setUnlockAt(e.target.value)} required={isTimeCapsule} />
              </div>
              <div className="space-y-2">
                <Label>Reality context</Label>
                <Select value={realityContext} onValueChange={(value) => setRealityContext(value as RealityContext)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="augmented">Augmented</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="neural">Neural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientIds">Connection IDs</Label>
              <Input
                id="recipientIds"
                value={recipientIds}
                onChange={(e) => setRecipientIds(e.target.value)}
                placeholder="Comma-separated user IDs who should receive the unlock"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeCapsuleMessage">Unlock note</Label>
              <Textarea
                id="timeCapsuleMessage"
                value={timeCapsuleMessage}
                onChange={(e) => setTimeCapsuleMessage(e.target.value)}
                placeholder="Add a message that appears when the capsule unlocks"
                className="min-h-[80px]"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-between">
        <Button 
          type="button" 
          onClick={() => setIsAICoPilotOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          AI Co-Pilot
        </Button>
        <div className="flex gap-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading}>
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Share Memory'
            )}
          </Button>
        </div>
      </div>

      {/* AI Co-Pilot Panel */}
      {isAICoPilotOpen && (
        <AICoPilotPanel
          currentContent={content}
          currentMediaCount={Object.values(sensoryData).flat().length}
          contentType="memory"
          onApplySuggestion={handleAISuggestionApply}
          onClose={() => setIsAICoPilotOpen(false)}
          existingEmotions={emotions}
        />
      )}
    </form>
  );
};