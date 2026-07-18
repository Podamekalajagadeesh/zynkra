import { useState, useEffect } from 'react';
import { getFollowerSuggestions, followUser } from '../lib/api';
import { UserProfile } from '../lib/types';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';

interface Page {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface SuggestionsResponse {
  users: UserProfile[];
  pages: Page[];
}

export function FollowerSuggestions() {
  const [userSuggestions, setUserSuggestions] = useState<UserProfile[]>([]);
  const [pageSuggestions, setPageSuggestions] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const data: SuggestionsResponse = await getFollowerSuggestions();
        setUserSuggestions(data.users);
        setPageSuggestions(data.pages);
      } catch (error) {
        console.error('Failed to fetch follower suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleFollowUser = async (userId: string) => {
    if (!currentUser) return;
    try {
      await followUser(userId);
      setUserSuggestions(userSuggestions.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const handleFollowPage = async (pageId: string) => {
    if (!currentUser) return;
    try {
      setPageSuggestions(pageSuggestions.filter(page => page.id !== pageId));
    } catch (error) {
      console.error('Failed to follow page:', error);
    }
  };

  const hasSuggestions = userSuggestions.length > 0 || pageSuggestions.length > 0;

  if (isLoading) {
    return <p>Loading suggestions...</p>;
  }

  if (!hasSuggestions) {
    return null;
  }

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-semibold mb-4">Recommended to follow</h3>
      
      {userSuggestions.length > 0 && (
        <>
          <h4 className="text-md font-medium mb-2">Users</h4>
          <div className="space-y-4">
            {userSuggestions.map(user => (
              <div key={user.id} className="flex items-center justify-between">
                <Link to={`/users/${user.id}`} className="flex items-center gap-2">
                  <img src={user.profilePhoto} alt={user.displayName} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-semibold">{user.displayName}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </Link>
                <Button size="sm" onClick={() => handleFollowUser(user.id)}>Follow</Button>
              </div>
            ))}
          </div>
        </>
      )}

      {pageSuggestions.length > 0 && (
        <>
          <h4 className="text-md font-medium mt-4 mb-2">Pages</h4>
          <div className="space-y-4">
            {pageSuggestions.map(page => (
              <div key={page.id} className="flex items-center justify-between">
                <Link to={`/pages/${page.id}`} className="flex items-center gap-2">
                  <img src={page.avatar || '/default-page-avatar.png'} alt={page.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-semibold">{page.name}</p>
                    <p className="text-sm text-gray-500">@{page.username}</p>
                  </div>
                </Link>
                <Button size="sm" onClick={() => handleFollowPage(page.id)}>Follow</Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}