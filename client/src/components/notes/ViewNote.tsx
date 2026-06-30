import { Note } from '../../lib/api/notes';
import { Button } from '../ui/button';

interface ViewNoteProps {
  note: Note;
  onClose: () => void;
}

export const ViewNote = ({ note, onClose }: ViewNoteProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-start">
          <p className="text-lg">{note.content}</p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            X
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Posted by {note.userId} - {new Date(note.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};