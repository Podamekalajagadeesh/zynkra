import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import { schedulePost, getOptimalPostingTime, getConnectedAccounts } from '../../lib/api';

import type { SchedulePostRequest, ScheduledPost, ConnectedAccount } from '../../lib/api';

type SchedulePostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPostScheduled: (post: ScheduledPost) => void;
  initialData?: SchedulePostRequest | null;
};

export const SchedulePostModal = ({ isOpen, onClose, onPostScheduled, initialData = null }: SchedulePostModalProps) => {
  const [content, setContent] = useState('');
  const [useOptimalTime, setUseOptimalTime] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [optimalTime, setOptimalTime] = useState<{ recommendedHour: number; confidence: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        getOptimalPostingTime(),
        getConnectedAccounts()
      ]).then(([time, accounts]) => {
        setOptimalTime(time);
        setConnectedAccounts(accounts.filter(a => a.isActive));
      }).catch(console.error);
      
      // Set default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split('T')[0]);
      
      // Use initial data if provided
      if (initialData?.content) {
        setContent(initialData.content);
      } else {
        setContent('');
      }
      
      if (optimalTime) {
        setScheduledTime(`${optimalTime.recommendedHour.toString().padStart(2, '0')}:00`);
      } else {
        setScheduledTime('12:00');
      }
      
      // Reset selected platforms when modal opens
      setSelectedPlatforms([]);
    }
  }, [isOpen, optimalTime, initialData]);

  const handlePlatformToggle = (accountId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const scheduledFor = useOptimalTime ? undefined : new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      
      const post = await schedulePost({
        content,
        postType: 'feed',
        scheduledFor,
        isOptimalTime: useOptimalTime,
        ...(initialData?.mediaUrl && { mediaUrl: initialData.mediaUrl }),
        ...(initialData?.visibility && { visibility: initialData.visibility }),
        crossPlatformIds: selectedPlatforms.length > 0 ? selectedPlatforms : undefined
      });
      
      onPostScheduled(post);
      onClose();
      setContent('');
    } catch (error) {
      console.error('Failed to schedule post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule a Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="content">Post Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What would you like to share?"
              required
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="use-optimal">Use Optimal Time</Label>
              <p className="text-sm text-gray-500">
                Automatically publish when your audience is most active
                {optimalTime && ` (recommended: ${optimalTime.recommendedHour}:00 UTC)`}
              </p>
            </div>
            <Switch
              id="use-optimal"
              checked={useOptimalTime}
              onCheckedChange={setUseOptimalTime}
            />
          </div>
          
          {!useOptimalTime && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {connectedAccounts.length > 0 && (
            <div className="space-y-3 border rounded-lg p-4">
              <Label>Publish to External Platforms</Label>
              <p className="text-sm text-gray-500">Select which connected social media accounts to publish this post to</p>
              <div className="grid grid-cols-2 gap-2">
                {connectedAccounts.map(account => (
                  <div key={account.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`platform-${account.id}`}
                      checked={selectedPlatforms.includes(account.id)}
                      onCheckedChange={() => handlePlatformToggle(account.id)}
                    />
                    <Label htmlFor={`platform-${account.id}`} className="text-sm">
                      {account.platformUsername}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling...' : 'Schedule Post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};