import { useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import { createScheduledStream } from '../lib/api';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

export const ScheduleStreamPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const { addToast } = useToast();

  const handleScheduleStream = async () => {
    if (!title || !scheduledTime) {
      addToast('Please enter a title and scheduled time.', 'warning');
      return;
    }

    try {
      await createScheduledStream({
        title,
        description,
        scheduledTime: new Date(scheduledTime),
      });
      addToast('Stream scheduled successfully!', 'success');
      setTitle('');
      setDescription('');
      setScheduledTime('');
    } catch (error) {
      console.error('Failed to schedule stream:', error);
      addToast('Failed to schedule stream.', 'error');
    }
  };

  return (
    <PageShell title="Schedule a Live Stream">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Schedule a Live Stream</h1>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700">Scheduled Time</label>
              <Input id="scheduledTime" type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
            </div>
            <Button onClick={handleScheduleStream}>Schedule Stream</Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
};