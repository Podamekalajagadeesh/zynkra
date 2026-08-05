import { useState, useEffect } from 'react';
import { getMutedUsers, unmuteUser } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/Avatar';
import { Link } from 'react-router-dom';

interface MutedUser {
  id: string;
  username: string;
  avatarUrl?: string;
  displayName?: string;
}

export function MutedUsersPage() {
  const { addToast } = useToast();
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMutedUsers = async () => {
      try {
        const users = await getMutedUsers();
        setMutedUsers(Array.isArray(users) ? users : []);
      } catch {
        setMutedUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMutedUsers();
  }, []);

  const handleUnmute = async (userId: string) => {
    try {
      await unmuteUser(userId);
      setMutedUsers((prev) => prev.filter((user) => user.id !== userId));
      addToast('Unmuted', 'success');
    } catch {
      addToast('Failed to unmute user', 'error');
    }
  };

  return (
    <PageShell
      eyebrow="Settings"
      title="Muted Users"
      description="Their posts and activity are hidden from your feeds."
    >
      <div className="space-y-3">
        {loading
          ? [...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border" />
            ))
          : mutedUsers.length === 0
            ? (
                <p className="text-muted-foreground">
                  No muted users.{' '}
                  <Link to="/settings" className="text-primary-600 hover:underline">
                    Privacy settings
                  </Link>{' '}
                  has more controls.
                </p>
              )
            : mutedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <Avatar src={user.avatarUrl} alt={user.username} className="h-10 w-10" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200" />
                    )}
                    <div>
                      <p className="font-medium">
                        {user.displayName || `@${user.username}`}
                      </p>
                      {user.displayName && (
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleUnmute(user.id)}>
                    Unmute
                  </Button>
                </div>
              ))}
      </div>
    </PageShell>
  );
}
