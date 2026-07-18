import { useState, useEffect } from 'react';
import { getBookmarks } from '../lib/api';
import { PostCard } from '../components/post-card';
import { PageShell } from '../components/PageShell';
import { Post } from '../lib/types';
import { Skeleton } from '../components/ui/skeleton';

interface Bookmark {
  id: string;
  post: Post;
}

export function BookmarkedPostsPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookmarks()
      .then(setBookmarks)
      .catch((err) => console.error('Failed to fetch bookmarks:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <h1 className="text-2xl font-bold mb-4">Bookmarked Posts</h1>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.length > 0 ? (
            bookmarks.map((bookmark) => (
              <PostCard key={bookmark.id} post={bookmark.post} />
            ))
          ) : (
            <p>You haven't bookmarked any posts yet.</p>
          )}
        </div>
      )}
    </PageShell>
  );
}