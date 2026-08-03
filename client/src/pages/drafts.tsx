import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteDraft, getDrafts, publishDraft } from '../lib/api';
import { Button } from '../components/ui/button';
import { useToast } from '../contexts/ToastContext';
import { FileText, Send, Trash2 } from 'lucide-react';

interface DraftItem {
  id: string;
  content: string;
  postType: string;
  visibility: string;
  createdAt: string;
  media?: { url: string; type: string }[];
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      setDrafts(await getDrafts());
    } catch {
      addToast('Failed to load drafts', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePublish = async (draft: DraftItem) => {
    setBusyId(draft.id);
    try {
      const post = await publishDraft(draft.id);
      addToast('Draft published', 'success');
      setDrafts((list) => list.filter((d) => d.id !== draft.id));
      navigate(`/posts/${post.id}`);
    } catch {
      addToast('Failed to publish draft', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteDraft(id);
      addToast('Draft deleted', 'success');
      setDrafts((list) => list.filter((d) => d.id !== id));
    } catch {
      addToast('Failed to delete draft', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl p-4">
        <h1 className="text-2xl font-bold mb-4">Drafts</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-8 h-8" />
        <h1 className="text-2xl font-bold">Drafts</h1>
        <span className="text-sm text-gray-500">({drafts.length})</span>
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">No drafts yet</h2>
          <p className="text-gray-500 mb-4">
            Start writing a post and it will be auto-saved here as you type.
          </p>
          <Button onClick={() => navigate('/create-post')}>Create a post</Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {drafts.map((draft) => (
            <li
              key={draft.id}
              className="rounded-xl border border-dark-200 bg-white/80 dark:bg-dark-800 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">{draft.content}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(draft.createdAt).toLocaleString()} · {draft.postType} ·{' '}
                    {draft.media?.length ? `${draft.media.length} media` : 'text only'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    onClick={() => handlePublish(draft)}
                    disabled={busyId === draft.id}
                  >
                    <Send className="w-4 h-4 mr-1" /> Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(draft.id)}
                    disabled={busyId === draft.id}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
