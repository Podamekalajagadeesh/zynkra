import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { UserProfile } from '../lib/types';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';

export function CloseFriendsSettings() {
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [closeFriends, setCloseFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [followersRes, closeFriendsRes] = await Promise.all([
          api.get('/users/me/followers'),
          api.get('/users/me/close-friends'),
        ]);
        setFollowers(followersRes.data);
        setCloseFriends(closeFriendsRes.data.map((user: UserProfile) => user.id));
      } catch (error) {
        addToast('Failed to fetch data. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addToast]);

  const handleToggleCloseFriend = async (userId: string) => {
    const isCloseFriend = closeFriends.includes(userId);
    const originalCloseFriends = [...closeFriends];

    try {
      let updatedCloseFriends;
      if (isCloseFriend) {
        updatedCloseFriends = closeFriends.filter((id) => id !== userId);
      } else {
        updatedCloseFriends = [...closeFriends, userId];
      }
      setCloseFriends(updatedCloseFriends);

      await api.put('/users/me/close-friends', { closeFriendIds: updatedCloseFriends });
      addToast(isCloseFriend ? 'Removed from Close Friends' : 'Added to Close Friends', 'success');
    } catch (error) {
      setCloseFriends(originalCloseFriends);
      addToast('Failed to update Close Friends list. Please try again.', 'error');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Close Friends</h1>
      <p className="text-dark-500 dark:text-dark-400 mb-6">
        Add or remove people from your Close Friends list. Only people on this list can see your stories shared with Close Friends.
      </p>

      <div className="space-y-4">
        {followers.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-semibold">{user.username}</p>
                <p className="text-sm text-dark-500 dark:text-dark-400">{user.displayName}</p>
              </div>
            </div>
            <Button
              variant={closeFriends.includes(user.id) ? 'secondary' : 'primary'}
              onClick={() => handleToggleCloseFriend(user.id)}
            >
              {closeFriends.includes(user.id) ? 'Remove' : 'Add'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}