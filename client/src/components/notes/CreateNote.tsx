import { useState } from 'react';
import { createNote, Note } from '../../lib/api/notes';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface CreateNoteProps {
  onClose: () => void;
  onNoteCreated: (note: Note) => void;
}

export const CreateNote = ({ onClose, onNoteCreated }: CreateNoteProps) => {
  const [content, setContent] = useState('');
  const [isLoading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const newNote = await createNote(content);
      onNoteCreated(newNote);
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create a Note</h2>
        <form onSubmit={handleSubmit}>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            maxLength={140}
            className="mb-4"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};