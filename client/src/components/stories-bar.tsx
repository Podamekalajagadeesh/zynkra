import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStories } from '../lib/api';
import type { Story } from '../lib/types';
import { StoryViewer } from './story-viewer';
import { CreateStoryForm } from './create-story-form';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function StoriesBar() {
  const [stories, setStories] = useState<Story[]>([]);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const fetchStories = async () => {
    try {
      const fetchedStories = await getStories();
      // Filter out expired stories, then sort with boosted stories first
      const now = new Date();
      const activeStories = fetchedStories.filter(story => new Date(story.expiresAt) > now);
      const sortedStories = [...activeStories].sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setStories(sortedStories);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const openStoryViewer = (index: number) => {
    setSelectedStoryIndex(index);
    setStoryViewerOpen(true);
  };

  const closeStoryViewer = () => {
    setStoryViewerOpen(false);
  };

  const openCreateStory = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setCreateStoryOpen(true);
  };

  const closeCreateStory = () => {
    setCreateStoryOpen(false);
  };

  const handleStoryCreated = () => {
    fetchStories();
  };

  return (
    <>
      <div className="border-b border-dark-200 bg-white/75 py-3 dark:border-dark-700/70 dark:bg-dark-900/75">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <p className="font-bold">Stories</p>
            <div className="flex gap-4 items-center">
              <Button
                onClick={openCreateStory}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
                disabled={loading}
                title={!user ? 'Sign in to create a story' : undefined}
              >
                <Plus size={16} />
                Create
              </Button>
              {stories.map((story, index) => (
                <div key={story.id} className="cursor-pointer relative" onClick={() => openStoryViewer(index)}>
                  <div className={`h-14 w-14 rounded-full p-1 ${story.isBoosted ? 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500' : 'bg-gradient-to-br from-primary-600 via-cyan-500 to-accent-600'}`}>
                    <img
                      className="h-full w-full rounded-full border-2 border-white dark:border-dark-900"
                      src={`https://i.pravatar.cc/150?u=${story.user.id}`}
                      alt={story.user.walletAddress || story.user.email || 'User'}
                    />
                  </div>
                  {story.isBoosted && (
                    <span className="absolute -top-1 -right-1 text-xs">🔥</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {storyViewerOpen && (
        <StoryViewer
          stories={stories}
          initialStoryIndex={selectedStoryIndex}
          onClose={closeStoryViewer}
        />
      )}
      {createStoryOpen && (
        <CreateStoryForm
          onClose={closeCreateStory}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </>
  );
}