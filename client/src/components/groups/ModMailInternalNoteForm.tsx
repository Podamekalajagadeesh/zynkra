import { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { sendModMailMessage } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { Shield } from 'lucide-react';

interface ModMailInternalNoteFormProps {
  groupId: string;
  conversationId: string;
  onNoteSent: () => void;
}

export function ModMailInternalNoteForm({ 
  groupId, 
  conversationId, 
  onNoteSent 
}: ModMailInternalNoteFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendModMailMessage(groupId, conversationId, note);
      addToast('Internal note added successfully', 'success');
      setIsOpen(false);
      setNote('');
      onNoteSent();
    } catch (error) {
      addToast('Failed to add internal note', 'error');
    }
  };

  if (!isOpen) {
    return (
      <Button 
        size="sm" 
        variant="ghost"
        className="flex items-center gap-1 text-amber-600 hover:text-amber-700"
        onClick={() => setIsOpen(true)}
      >
        <Shield className="h-4 w-4" />
        Add Internal Note
      </Button>
    );
  }

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
      <h4 className="font-semibold mb-2 flex items-center gap-1 text-amber-800 dark:text-amber-300">
        <Shield className="h-4 w-4" />
        Add Internal Note (Only visible to mods)
      </h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Add a private note for other moderators..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required
          rows={3}
          className="bg-white dark:bg-dark-900"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
            Add Note
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}