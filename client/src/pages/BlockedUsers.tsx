import { useEffect, useState } from 'react';
import { User } from '../../server/src/users/entities/user.entity';
import { getBlockedUsers, unblockUser } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';

export function BlockedUsers() {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      getBlockedUsers().then(setBlockedUsers);
    }
  }, [user]);

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser(userId);
      setBlockedUsers(blockedUsers.filter(u => u.id !== userId));
      addToast('User unblocked', 'success');
    } catch (error) {
      console.error('Failed to unblock user:', error);
      addToast('Failed to unblock user', 'error');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Blocked Users</h1>
      <div className="space-y-4">
        {blockedUsers.map(blockedUser => (
          <div key={blockedUser.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <Avatar src={blockedUser.avatar} alt={blockedUser.username} />
              <div>
                <p className="font-semibold">{blockedUser.displayName}</p>
                <p className="text-sm text-gray-500">@{blockedUser.username}</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => handleUnblock(blockedUser.id)}>
              Unblock
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}