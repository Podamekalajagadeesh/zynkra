import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { getHighlight, getUserHighlights } from '../lib/api';
import type { Story, StoryHighlight } from '../lib/types';
import { HighlightFormModal } from './highlight-form-modal';

interface HighlightsStripProps {
  /** Profile username (or id) whose highlights are being viewed. */
  username: string;
  isOwnProfile: boolean;
  /** Opens the StoryViewer with a highlight's stories. */
  onOpenStories: (stories: Story[]) => void;
}

export function HighlightsStrip({ username, isOwnProfile, onOpenStories }: HighlightsStripProps) {
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<StoryHighlight | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await getUserHighlights(username);
      setHighlights(list);
    } catch (error) {
      console.error('Failed to fetch highlights:', error);
      setHighlights([]);
    } finally {
      setHasLoaded(true);
    }
  }, [username]);

  useEffect(() => {
    setHasLoaded(false);
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (highlight: StoryHighlight) => {
    setEditing(highlight);
    setIsFormOpen(true);
  };

  const openHighlight = async (highlightId: string) => {
    try {
      const fresh = await getHighlight(highlightId);
      if (fresh?.stories?.length) {
        onOpenStories(fresh.stories);
      }
    } catch (error) {
      console.error('Failed to open highlight:', error);
    }
  };

  if (!hasLoaded || (highlights.length === 0 && !isOwnProfile)) {
    return null;
  }

  return (
    <section aria-label="Highlights" className="space-y-2">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {isOwnProfile && (
          <button
            type="button"
            onClick={openCreate}
            aria-label="Add highlight"
            className="flex w-16 shrink-0 flex-col items-center gap-1"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-dark-300 text-dark-500 transition-colors hover:border-primary-600 hover:text-primary-600">
              <Plus size={22} />
            </span>
            <span className="w-16 truncate text-center text-xs text-dark-500">New</span>
          </button>
        )}

        {highlights.map((highlight) => (
          <div key={highlight.id} className="relative w-16 shrink-0">
            <button
              type="button"
              onClick={() => openHighlight(highlight.id)}
              aria-label={`Open highlight ${highlight.title}`}
              className="flex w-16 flex-col items-center gap-1"
            >
              <img
                src={highlight.coverUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-2 ring-dark-200 transition-shadow hover:ring-primary-600"
              />
              <span className="w-16 truncate text-center text-xs text-dark-500">
                {highlight.title}
              </span>
            </button>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => openEdit(highlight)}
                aria-label={`Edit highlight ${highlight.title}`}
                className="absolute -right-1 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white text-dark-500 shadow-sm ring-1 ring-dark-200 transition-colors hover:text-primary-600"
              >
                <Pencil size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      <HighlightFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={editing ? 'edit' : 'create'}
        highlight={editing}
        onSaved={load}
      />
    </section>
  );
}
