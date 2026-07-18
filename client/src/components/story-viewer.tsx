import { useState, useEffect, useCallback } from 'react';
import { Story, UserProfile } from '../lib/types';
import { X, Send, Crown, EyeOff, Users, Search } from 'lucide-react';
import { Mention } from './Mention';
import { Poll } from './poll';
import { addStoryReaction, addStoryReply, trackStoryView, getStoryViews } from '../lib/api';
import { useScreenshotProtection } from '../hooks/useScreenshotProtection';
import { ScreenshotProtectionLevel } from '../lib/types';
import { useIsPremium } from '../hooks/useIsPremium';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
const ANIMATED_REACTIONS = ['🎉', '🎊', '✨', '💥', '🔥', '💖'];

interface AnimatedReaction {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
}

export function StoryViewer({ stories, initialStoryIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [replyText, setReplyText] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<AnimatedReaction[]>([]);
  const [isAnonymousView, setIsAnonymousView] = useState(false);
  const [storyViewers, setStoryViewers] = useState<UserProfile[]>([]);
  const [viewerSearchQuery, setViewerSearchQuery] = useState('');
  const activeStory = stories[currentIndex];
  const isPremium = useIsPremium();

  // Fetch story viewers when active story changes
  useEffect(() => {
    if (activeStory) {
      getStoryViews(activeStory.id).then(views => {
        setStoryViewers(views || []);
      }).catch(error => {
        console.error('Failed to fetch story viewers:', error);
        setStoryViewers([]);
      });
    }
  }, [activeStory?.id]);

  // Filter viewers based on search query
  const filteredViewers = storyViewers.filter(viewer => {
    const searchLower = viewerSearchQuery.toLowerCase();
    return (
      viewer.username?.toLowerCase().includes(searchLower) ||
      viewer.displayName?.toLowerCase().includes(searchLower) ||
      viewer.email?.toLowerCase().includes(searchLower) ||
      viewer.walletAddress?.toLowerCase().includes(searchLower)
    );
  });
  
  // Apply screenshot protection if enabled for this story
  const shouldApplyProtection = activeStory.user.screenshotProtection?.enabled && activeStory.user.screenshotProtection?.applyToStories;
  
  const { protectionRef } = useScreenshotProtection({
    enabled: shouldApplyProtection,
    level: (activeStory.user.screenshotProtection?.level as ScreenshotProtectionLevel) || ScreenshotProtectionLevel.WARNING_ONLY,
    contentTitle: 'this story',
  });

  // Track view when story opens
  useEffect(() => {
    if (activeStory) {
      trackStoryView(activeStory.id, isAnonymousView).catch(error => {
        console.error('Failed to track story view:', error);
      });
    }
  }, [activeStory?.id, isAnonymousView]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
      }
    }, 5000); // Auto-advance after 5 seconds

    return () => clearTimeout(timer);
  }, [currentIndex, stories.length, onClose]);

  // Clean up old reactions after animation completes
  useEffect(() => {
    if (floatingReactions.length > 0) {
      const timer = setTimeout(() => {
        setFloatingReactions(prev => prev.slice(1));
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [floatingReactions]);

  const triggerAnimatedReaction = useCallback((reaction: string) => {
    if (!isPremium) return;
    
    const newReactions: AnimatedReaction[] = [];
    // Create 15 floating emojis that spread across the screen
    for (let i = 0; i < 15; i++) {
      newReactions.push({
        id: Date.now() + i,
        emoji: reaction,
        x: Math.random() * 80 + 10, // Random X position (10-90%)
        y: Math.random() * 60 + 20, // Random Y position (20-80%)
      });
    }
    setFloatingReactions(prev => [...prev, ...newReactions]);
  }, [isPremium]);

  const handleReaction = async (reaction: string) => {
    if (!activeStory) return;
    try {
      await addStoryReaction(activeStory.id, reaction);
      // Trigger animated effect only if user is premium
      if (isPremium) {
        triggerAnimatedReaction(reaction);
      }
    } catch (error) {
      console.error('Failed to add reaction', error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStory || !replyText.trim()) return;
    try {
      await addStoryReply(activeStory.id, replyText);
      setReplyText('');
    } catch (error) {
      console.error('Failed to add reply', error);
    }
  };

  if (!activeStory) {
    return null;
  }

  const pollElement = activeStory.elements?.find((e) => e.type === 'poll');
  const mentionElement = activeStory.elements?.find((e) => e.type === 'mention');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div ref={protectionRef} className="relative h-full max-h-[90vh] w-full max-w-md rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-2 bg-gray-500/50">
          <div className="h-full bg-white" style={{ width: '100%', animation: 'progress 5s linear forwards' }} />
        </div>
        <img src={activeStory.mediaUrl} alt="Story" className="h-full w-full object-cover" />
        
        {/* Animated floating reactions */}
        {floatingReactions.map((floating) => (
          <div
            key={floating.id}
            className="absolute text-4xl pointer-events-none"
            style={{
              left: `${floating.x}%`,
              top: `${floating.y}%`,
              animation: 'floatUp 2.5s ease-out forwards',
            }}
          >
            {floating.emoji}
          </div>
        ))}

        <div className="absolute top-4 left-4 flex items-center gap-2 text-white">
          <img
            src={`https://i.pravatar.cc/150?u=${activeStory.user.id}`}
            alt={activeStory.user.walletAddress || activeStory.user.email || 'User'}
            className="h-10 w-10 rounded-full border-2 border-white"
          />
          <span className="font-bold">{activeStory.user.walletAddress || activeStory.user.email || 'User'}</span>
          {isPremium && <Crown size={16} className="text-yellow-400" />}
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-white">
          <X size={24} />
        </button>
        {isPremium && (
          <button 
            onClick={() => setIsAnonymousView(!isAnonymousView)} 
            className={`absolute top-4 right-12 ${isAnonymousView ? 'text-yellow-400' : 'text-white'}`}
            title={isAnonymousView ? 'Anonymous viewing enabled' : 'Enable anonymous viewing'}
          >
            <EyeOff size={24} />
          </button>
        )}
        {/* Viewers list dialog with search */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="absolute top-4 right-28 text-white flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded-md transition-colors">
              <Users size={20} />
              <span className="text-sm">{storyViewers.length}</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Story Viewers ({storyViewers.length})</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <Input
                placeholder="Search viewers..."
                value={viewerSearchQuery}
                onChange={(e) => setViewerSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filteredViewers.length > 0 ? (
                filteredViewers.map((viewer) => (
                  <div key={viewer.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <img
                      src={viewer.pfp || `https://i.pravatar.cc/150?u=${viewer.id}`}
                      alt={viewer.username || viewer.displayName || 'User'}
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{viewer.displayName || viewer.username || viewer.email || 'Anonymous User'}</p>
                      <p className="text-sm text-gray-500">@{viewer.username || viewer.walletAddress?.slice(0, 8) || 'unknown'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  {viewerSearchQuery ? 'No viewers match your search' : 'No viewers yet'}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
        {pollElement && 'question' in pollElement.data && 'options' in pollElement.data && (
          <Poll
            question={pollElement.data.question}
            options={pollElement.data.options}
          />
        )}
        {mentionElement && 'username' in mentionElement.data && (
          <Mention username={mentionElement.data.username} />
        )}
        <div className="absolute bottom-4 left-4 right-4">
          {/* Standard reactions */}
          <div className="flex justify-center space-x-2 mb-2">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction}
                onClick={() => handleReaction(reaction)}
                className="p-2 text-2xl rounded-full hover:bg-gray-500/50 transition-transform hover:scale-110"
              >
                {reaction}
              </button>
            ))}
          </div>
          {/* Premium animated reactions */}
          {isPremium && (
            <div className="flex justify-center space-x-2 mb-2">
              <span className="text-xs text-white/70 flex items-center gap-1 mr-2">
                <Crown size={12} className="text-yellow-400" /> Premium animated:
              </span>
              {ANIMATED_REACTIONS.map((reaction) => (
                <button
                  key={reaction}
                  onClick={() => handleReaction(reaction)}
                  className="p-2 text-2xl rounded-full hover:bg-gray-500/50 transition-transform hover:scale-125 animate-pulse"
                >
                  {reaction}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Send a message"
              className="w-full px-4 py-2 rounded-full bg-gray-800/50 text-white placeholder-gray-300 focus:outline-none"
            />
            <button type="submit" className="p-2 rounded-full bg-gray-800/50 text-white">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px) scale(2) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}