import { FC, useState, useEffect } from 'react';
import { getNotesForPost, createCommunityNote, voteNoteHelpfulness } from '../lib/api';
import { ThumbsUp, ThumbsDown, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { AvatarImage } from './ui/avatar';
import { useToast } from '../contexts/ToastContext';

interface CommunityNotesProps {
  postId: string;
}

interface Note {
  id: string;
  content: string;
  user: {
    username: string;
    profile: {
      avatarUrl: string;
      displayName: string;
    };
  };
  helpfulnessUpvotes: number;
  helpfulnessDownvotes: number;
  createdAt: string;
}

export const CommunityNotes: FC<CommunityNotesProps> = ({ postId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const fetchedNotes = await getNotesForPost(postId);
        setNotes(fetchedNotes);
      } catch (error) {
        console.error('Failed to fetch community notes', error);
      }
    };
    fetchNotes();
  }, [postId]);

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;
    try {
      await createCommunityNote(newNoteContent, postId);
      addToast('Community note created successfully!', 'success');
      setNewNoteContent('');
      setShowCreateNote(false);
      // Refresh notes
      const fetchedNotes = await getNotesForPost(postId);
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Failed to create note', error);
      addToast('Failed to create community note', 'error');
    }
  };

  const handleVote = async (noteId: string, isUpvote: boolean) => {
    try {
      await voteNoteHelpfulness(noteId, isUpvote);
      // Refresh notes
      const fetchedNotes = await getNotesForPost(postId);
      setNotes(fetchedNotes);
      addToast('Vote recorded!', 'success');
    } catch (error) {
      console.error('Failed to vote', error);
      addToast('Failed to record vote', 'error');
    }
  };

  return (
    <div className="mt-4 border-t border-dark-200 pt-4 dark:border-dark-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-dark-700 dark:text-dark-300">
          Community Notes ({notes.length})
        </h3>
        <button
          onClick={() => setShowCreateNote(!showCreateNote)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          <Plus size={14} />
          Add note
        </button>
      </div>

      {showCreateNote && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Add a community note to provide additional context..."
            maxLength={140}
            className="w-full p-2 text-sm border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-900 text-dark-900 dark:text-dark-100 resize-none"
            rows={3}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-dark-500">{newNoteContent.length}/140</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowCreateNote(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateNote} disabled={!newNoteContent.trim()}>
                Post Note
              </Button>
            </div>
          </div>
        </div>
      )}

      {notes.map((note) => (
        <div key={note.id} className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 overflow-hidden rounded-full">
              <AvatarImage src={note.user.profile.avatarUrl} alt={note.user.username} className="h-full w-full object-cover" />
            </div>
            <span className="text-xs font-medium text-dark-700 dark:text-dark-300">
              {note.user.profile.displayName} (@{note.user.username})
            </span>
          </div>
          <p className="text-sm text-dark-800 dark:text-dark-200 mb-3">{note.content}</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleVote(note.id, true)}
              className="flex items-center gap-1 text-xs text-dark-600 hover:text-green-600 dark:text-dark-400"
            >
              <ThumbsUp size={14} />
              {note.helpfulnessUpvotes}
            </button>
            <button
              onClick={() => handleVote(note.id, false)}
              className="flex items-center gap-1 text-xs text-dark-600 hover:text-red-600 dark:text-dark-400"
            >
              <ThumbsDown size={14} />
              {note.helpfulnessDownvotes}
            </button>
          </div>
        </div>
      ))}

      {notes.length === 0 && !showCreateNote && (
        <p className="text-sm text-dark-500 dark:text-dark-400 italic">
          No community notes yet. Be the first to add context to this post!
        </p>
      )}
    </div>
  );
};