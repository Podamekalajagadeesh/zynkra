import React, { useState } from 'react';
import { setPostCollaborators } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '../contexts/ToastContext';
import { useUser } from '../hooks/useUser';
import { Users, X } from 'lucide-react';

export interface Collaborator {
  id: string;
  username?: string;
  displayName?: string;
}

export function PostCollaborators({
  postId,
  collaborators,
  authorId,
}: {
  postId: string;
  collaborators: Collaborator[];
  authorId?: string;
}) {
  const { user } = useUser();
  const [current, setCurrent] = useState<Collaborator[]>(collaborators);
  const [collabId, setCollabId] = useState('');
  const { addToast } = useToast();
  const isAuthor = !!user && user.id === authorId;

  const apply = async (userIds: string[]) => {
    try {
      const updated = await setPostCollaborators(postId, userIds);
      setCurrent(updated.collaborators || []);
    } catch {
      addToast('Failed to update collaborators', 'error');
    }
  };

  const add = () => {
    if (!collabId.trim() || current.length >= 5) return;
    void apply([...current.map((c) => c.id), collabId.trim()]);
    setCollabId('');
  };

  const remove = (id: string) => {
    void apply(current.filter((c) => c.id !== id).map((c) => c.id));
  };

  if (current.length === 0 && !isAuthor) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-dark-200 bg-white/80 p-4 dark:bg-dark-800">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-5 w-5 text-gray-500" />
        <h3 className="font-semibold">Collaborators</h3>
        <span className="text-xs text-gray-500">({current.length}/5)</span>
      </div>

      {current.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {current.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-dark-700"
            >
              {c.displayName || c.username || c.id}
              {isAuthor && (
                <button
                  aria-label={`Remove collaborator ${c.username || c.id}`}
                  className="text-gray-400 hover:text-red-500"
                  onClick={() => remove(c.id)}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {isAuthor && (
        <div className="flex gap-2">
          <Input
            placeholder="User ID to add"
            value={collabId}
            onChange={(e) => setCollabId(e.target.value)}
            className="h-9 text-xs"
          />
          <Button size="sm" onClick={add} disabled={!collabId.trim() || current.length >= 5}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
