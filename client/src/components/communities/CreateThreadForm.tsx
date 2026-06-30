import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus } from 'lucide-react';
import { Community, ThreadFlair } from '../../lib/types';

interface CreateThreadFormProps {
  community: Community;
  onCreateThread: (thread: {
    title: string;
    content: string;
    flairs: ThreadFlair[];
    isMegathread: boolean;
    media?: { url: string; type: 'image' | 'video' }[];
  }) => void;
}

export const CreateThreadForm = ({ community, onCreateThread }: CreateThreadFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFlairs, setSelectedFlairs] = useState<ThreadFlair[]>([]);
  const [isMegathread, setIsMegathread] = useState(false);

  const toggleFlair = (flair: ThreadFlair) => {
    const isSelected = selectedFlairs.find((f) => f.id === flair.id);
    if (isSelected) {
      setSelectedFlairs(selectedFlairs.filter((f) => f.id !== flair.id));
    } else {
      setSelectedFlairs([...selectedFlairs, flair]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onCreateThread({
        title,
        content,
        flairs: selectedFlairs,
        isMegathread,
      });
      setTitle('');
      setContent('');
      setSelectedFlairs([]);
      setIsMegathread(false);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} />
          Create Thread
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Thread in r/{community.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Thread Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your thread a title"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-[150px]"
              required
            />
          </div>
          {community.flairs.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Add Flairs</label>
              <div className="flex flex-wrap gap-2">
                {community.flairs.map((flair) => (
                  <button
                    key={flair.id}
                    type="button"
                    onClick={() => toggleFlair(flair)}
                    className={`px-2 py-1 text-xs font-medium rounded-full transition-opacity ${
                      selectedFlairs.find((f) => f.id === flair.id)
                        ? 'ring-2 ring-offset-2 ring-primary-500'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: flair.color,
                      color: flair.textColor,
                    }}
                  >
                    {flair.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isMegathread}
              onChange={(e) => setIsMegathread(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Mark as Megathread (pinned announcement)</span>
          </label>
          <Button type="submit" className="w-full">Post Thread</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};