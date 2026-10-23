import { useEffect, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { createHighlight, deleteHighlight, getStories, updateHighlight } from '../lib/api';
import type { Story, StoryHighlight } from '../lib/types';
import { useUser } from '../hooks/useUser';
import { useToast } from '../hooks/useToast';

interface HighlightFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  /** The highlight being edited (edit mode only). */
  highlight: StoryHighlight | null;
  /** Called after a successful create/update/delete so the strip can refetch. */
  onSaved: () => void;
}

export function HighlightFormModal({
  open,
  onOpenChange,
  mode,
  highlight,
  onSaved,
}: HighlightFormModalProps) {
  const { user } = useUser();
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [candidateStories, setCandidateStories] = useState<Story[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [remainingStories, setRemainingStories] = useState<Story[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(mode === 'edit' && highlight ? highlight.title : '');
    setSelectedIds([]);
    setRemainingStories(mode === 'edit' && highlight ? highlight.stories : []);
    setIsConfirmDeleteOpen(false);
    if (mode === 'create' && user?.id) {
      getStories()
        .then((stories) => {
          setCandidateStories(stories.filter((story) => story.user.id === user.id));
        })
        .catch((error) => {
          console.error('Failed to load stories for highlight:', error);
          setCandidateStories([]);
        });
    }
  }, [open, mode, highlight, user?.id]);

  const toggleStory = (storyId: string) => {
    setSelectedIds((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  };

  const removeStory = (storyId: string) => {
    setRemainingStories((prev) =>
      prev.length > 1 ? prev.filter((story) => story.id !== storyId) : prev
    );
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || selectedIds.length === 0 || isSaving) return;
    const coverStory = candidateStories.find((story) => story.id === selectedIds[0]);
    setIsSaving(true);
    try {
      await createHighlight({
        title: trimmed,
        coverUrl: coverStory?.mediaUrl ?? '',
        storyIds: selectedIds,
      });
      addToast('Highlight created', 'success');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create highlight:', error);
      addToast('Failed to create highlight', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !highlight || isSaving) return;
    setIsSaving(true);
    try {
      await updateHighlight(highlight.id, {
        title: trimmed,
        storyIds: remainingStories.map((story) => story.id),
      });
      addToast('Highlight updated', 'success');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update highlight:', error);
      addToast('Failed to update highlight', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!highlight || isSaving) return;
    setIsSaving(true);
    try {
      await deleteHighlight(highlight.id);
      addToast('Highlight deleted', 'success');
      setIsConfirmDeleteOpen(false);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete highlight:', error);
      addToast('Failed to delete highlight', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'New highlight' : 'Edit highlight'}</DialogTitle>
          </DialogHeader>

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-dark-500">Title</p>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Travel, Best moments"
                  maxLength={100}
                  aria-label="Highlight title"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-dark-500">
                  Choose stories ({selectedIds.length} selected)
                </p>
                {candidateStories.length === 0 ? (
                  <p className="text-sm italic text-dark-500">
                    No active stories yet — post a story first.
                  </p>
                ) : (
                  <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto">
                    {candidateStories.map((story) => {
                      const isSelected = selectedIds.includes(story.id);
                      return (
                        <button
                          key={story.id}
                          type="button"
                          onClick={() => toggleStory(story.id)}
                          aria-pressed={isSelected}
                          aria-label={`Select story ${story.id}`}
                          className={`relative aspect-[9/16] overflow-hidden rounded-lg ${
                            isSelected ? 'ring-2 ring-primary-600' : 'ring-1 ring-dark-200'
                          }`}
                        >
                          <img src={story.mediaUrl} alt="" className="h-full w-full object-cover" />
                          {isSelected && (
                            <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                              <Check size={12} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  aria-label="Cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!title.trim() || selectedIds.length === 0 || isSaving}
                >
                  <Plus size={16} className="mr-1" />
                  Create
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-dark-500">Title</p>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Highlight title"
                  maxLength={100}
                  aria-label="Highlight title"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-dark-500">
                  Stories ({remainingStories.length})
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {remainingStories.map((story) => (
                    <div
                      key={story.id}
                      className="relative aspect-[9/16] w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-dark-200"
                    >
                      <img src={story.mediaUrl} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeStory(story.id)}
                        disabled={remainingStories.length <= 1}
                        aria-label={`Remove story ${story.id}`}
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-40"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                {remainingStories.length <= 1 && (
                  <p className="mt-1 text-xs text-dark-500">
                    A highlight needs at least one story.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="text-red-600 hover:text-red-700"
                  aria-label="Delete highlight"
                >
                  <Trash2 size={16} className="mr-1" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    aria-label="Cancel"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!title.trim() || isSaving}>
                    Save
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this highlight?</AlertDialogTitle>
            <AlertDialogDescription>
              The highlight will be removed from your profile. The stories themselves stay on your
              account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
