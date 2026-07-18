import { useEffect, useState } from 'react';
import { getStories } from '../lib/api';
import { Story } from '../lib/types';
import { Avatar } from './Avatar';

export function StoriesTray() {
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const fetchedStories = await getStories();
        setStories(fetchedStories);
      } catch (error) {
        console.error('Failed to fetch stories:', error);
      }
    };

    fetchStories();
  }, []);

  if (stories.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-dark-200 dark:border-dark-700 py-4">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 overflow-x-auto">
          {stories.map((story) => (
            <div key={story.id} className="flex-shrink-0">
              <div className="relative">
                <Avatar
                  src={story.user.avatarUrl}
                  alt={story.user.username}
                  className="h-16 w-16 rounded-full border-2 border-primary-500"
                />
              </div>
              <p className="text-center text-xs mt-1">{story.user.username}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}