// @ts-nocheck
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { schedulePost } from '../../lib/api';

type BulkPost = {
  id: string;
  content: string;
  scheduledFor: string;
};

type BulkUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
};

export const BulkUploadModal = ({ isOpen, onClose, onUploadComplete }: BulkUploadModalProps) => {
  const [posts, setPosts] = useState<BulkPost[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      // Simple CSV parsing - in production this would be more robust
      const lines = text.split('\n').filter(line => line.trim());
      const parsedPosts: BulkPost[] = [];
      
      // Skip header row if it exists
      const startIndex = lines[0].toLowerCase().includes('content') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const [content, date] = lines[i].split(',').map(s => s?.trim());
        if (content && date) {
          parsedPosts.push({
            id: `bulk-${i}`,
            content,
            scheduledFor: new Date(date).toISOString()
          });
        }
      }
      
      setPosts(parsedPosts);
      setParseError(null);
    } catch (err) {
      setParseError('Failed to parse CSV file. Please check the format.');
      console.error('CSV parse error:', err);
    }
  };

  const handleBulkSchedule = async () => {
    setIsSubmitting(true);
    try {
      await Promise.all(posts.map(post => 
        schedulePost({
          content: post.content,
          postType: 'feed',
          scheduledFor: post.scheduledFor
        })
      ));
      onUploadComplete();
      onClose();
      setPosts([]);
    } catch (error) {
      console.error('Failed to schedule bulk posts:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload & Schedule Posts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-upload">Upload CSV File</Label>
            <p className="text-sm text-gray-500 mb-2">
              CSV format: content, scheduled_date (YYYY-MM-DDTHH:MM:SS)
            </p>
            <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} />
            {parseError && <p className="text-red-500 text-sm mt-1">{parseError}</p>}
          </div>

          {posts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Posts to Schedule ({posts.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {posts.map(post => (
                  <div key={post.id} className="border rounded p-2 flex justify-between items-start">
                    <div>
                      <p className="text-sm">{post.content.substring(0, 50)}...</p>
                      <p className="text-xs text-gray-500">{new Date(post.scheduledFor).toLocaleString()}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => removePost(post.id)}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          {posts.length > 0 && (
            <Button onClick={handleBulkSchedule} disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling...' : `Schedule All ${posts.length} Posts`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};