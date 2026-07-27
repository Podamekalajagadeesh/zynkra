import { useEffect, useState } from 'react';
import { getFollowingNotes, Note } from '../../lib/api/notes';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { CreateNote } from './CreateNote';
import { ViewNote } from './ViewNote';

export const NotesBar = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = () => {
    getFollowingNotes().then(setNotes);
  };

  const handleNoteCreated = (newNote: Note) => {
    setNotes([newNote, ...notes]);
    setCreateOpen(false);
  };

  return (
    <div className="p-4 border-b">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <button onClick={() => setCreateOpen(true)}>
            <Avatar>
              <AvatarImage src={user?.profile?.avatarUrl} />
              <AvatarFallback>{user?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
            </Avatar>
          </button>
        </div>
        <div className="flex space-x-4 overflow-x-auto">
          {notes.map((note) => (
            <button key={note.id} onClick={() => setSelectedNote(note)}>
              <Avatar>
                <AvatarFallback>{note.userId.charAt(0)}</AvatarFallback>
              </Avatar>
            </button>
          ))}
        </div>
      </div>
      {isCreateOpen && (
        <CreateNote
          onClose={() => setCreateOpen(false)}
          onNoteCreated={handleNoteCreated}
        />
      )}
      {selectedNote && (
        <ViewNote note={selectedNote} onClose={() => setSelectedNote(null)} />
      )}
    </div>
  );
};