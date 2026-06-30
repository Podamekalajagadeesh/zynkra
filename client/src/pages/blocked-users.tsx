import { useState, useEffect } from 'react';
import { getBlockedUsers, unblockUser } from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/Avatar';
import { Link } from 'react-router-dom';

interface BlockedUser {
  id: string;
  username: string;
  avatarUrl: string;
}

export function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const users = await getBlockedUsers();
        setBlockedUsers(users);
      } catch (error) {
        console.error('Failed to fetch blocked users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedUsers();
  }, []);

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser(userId);
      setBlockedUsers(blockedUsers.filter((user) => user.id !== userId));
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  };

  if (loading) {
    return (
      <PageShell eyebrow="Settings" title="Blocked Users" description="Loading your blocked users...">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
              <div className="h-10 bg-gray-200 rounded w-20 animate-pulse" />
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Settings" title="Blocked Users" description="Manage the users you have blocked.">
      <div className="space-y-4">
        {blockedUsers.length > 0 ? (
          blockedUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded-lg border p-4">
              <Link to={`/user/${user.id}`} className="flex items-center gap-4">
                <Avatar src={user.avatarUrl} alt={user.username} className="h-12 w-12" />
                <span className="font-medium">{user.username}</span>
              </Link>
              <Button variant="secondary" onClick={() => handleUnblock(user.id)}>
                Unblock
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">You haven't blocked anyone yet.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}