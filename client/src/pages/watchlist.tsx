import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getWatchlist, removeFromWatchlist } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/Avatar';
import { EyeOff } from 'lucide-react';

interface WatchlistItem {
  id: string;
  post: {
    id: string;
    content?: string;
    createdAt: string;
    user?: { id: string; username: string; avatarUrl?: string };
  };
}

export function WatchlistPage() {
  const { addToast } = useToast();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = useCallback(async () => {
    try {
      const data = await getWatchlist();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleRemove = async (itemId: string, postId: string) => {
    try {
      await removeFromWatchlist(postId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      addToast('Removed from watchlist', 'success');
    } catch {
      addToast('Failed to remove from watchlist', 'error');
    }
  };

  return (
    <PageShell
      eyebrow="Library"
      title="Watchlist"
      description="Posts you saved to watch later."
    >
      <div className="space-y-3">
        {loading
          ? [...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border" />
            ))
          : items.length === 0
            ? (
                <p className="text-muted-foreground">
                  Your watchlist is empty.{' '}
                  <Link to="/" className="text-primary-600 hover:underline">
                    Browse posts
                  </Link>{' '}
                  and tap “Watch later”.
                </p>
              )
            : items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <Link to={`/post/${item.post.id}`} className="min-w-0">
                    <div className="flex items-center gap-3">
                      {item.post.user?.avatarUrl ? (
                        <Avatar
                          src={item.post.user.avatarUrl}
                          alt={item.post.user?.username ?? 'user'}
                          className="h-9 w-9"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gray-200" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          @{item.post.user?.username ?? 'unknown'}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {item.post.content || '(media post)'}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(item.id, item.post.id)}
                  >
                    <EyeOff className="w-4 h-4 mr-1" /> Un-watch
                  </Button>
                </div>
              ))}
      </div>
    </PageShell>
  );
}
