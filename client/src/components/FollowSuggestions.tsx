import { useState, useEffect } from 'react';
import { User } from '../lib/types';
import { getFollowSuggestions, followUser } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Button } from './ui/button';

interface Page {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface SuggestionsResponse {
  users: User[];
  pages: Page[];
}

export function FollowSuggestions() {
  const { user: currentUser, setUser: setCurrentUser } = useAuth();
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [pageSuggestions, setPageSuggestions] = useState<Page[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const data: SuggestionsResponse = await getFollowSuggestions();
        setUserSuggestions(data.users);
        setPageSuggestions(data.pages);
      } catch (error) {
        console.error('Failed to fetch follow suggestions:', error);
      }
    };

    if (currentUser) {
      fetchSuggestions();
    }
  }, [currentUser]);

  const handleFollowUser = async (userId: string) => {
    if (!currentUser) return;

    try {
      await followUser(userId);
      setUserSuggestions(userSuggestions.filter((user) => user.id !== userId));
      addToast('User followed!', 'success');
    } catch (error) {
      console.error('Failed to follow user:', error);
      addToast('Failed to follow user', 'error');
    }
  };

  const handleFollowPage = async (pageId: string) => {
    if (!currentUser) return;

    try {
      // You would implement a followPage API call, but for now just remove from suggestions
      setPageSuggestions(pageSuggestions.filter((page) => page.id !== pageId));
      addToast('Page followed!', 'success');
    } catch (error) {
      console.error('Failed to follow page:', error);
      addToast('Failed to follow page', 'error');
    }
  };

  const hasSuggestions = userSuggestions.length > 0 || pageSuggestions.length > 0;

  if (!hasSuggestions) {
    return null;
  }

  return (
    <div className="surface-soft p-4">
      <h3 className="text-lg font-semibold">Recommended to follow</h3>
      
      {userSuggestions.length > 0 && (
        <>
          <h4 className="text-md font-medium mt-4 mb-2">Users</h4>
          <div className="space-y-4">
            {userSuggestions.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{user.displayName || user.email}</p>
                  <p className="text-sm text-dark-500">@{user.username}</p>
                </div>
                <Button size="sm" onClick={() => handleFollowUser(user.id)}>
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {pageSuggestions.length > 0 && (
        <>
          <h4 className="text-md font-medium mt-6 mb-2">Pages</h4>
          <div className="space-y-4">
            {pageSuggestions.map((page) => (
              <div key={page.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{page.name}</p>
                  <p className="text-sm text-dark-500">@{page.username}</p>
                </div>
                <Button size="sm" onClick={() => handleFollowPage(page.id)}>
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}