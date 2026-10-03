import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPlace, getPlacePosts } from '../lib/api';
import { PageShell } from '../components/PageShell';
import { PostList } from '../components/post-list';
import { Skeleton } from '../components/ui/skeleton';
import { MapPin } from 'lucide-react';
import type { Post } from '../lib/types';

type PlaceDetail = {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export default function PlacePage() {
  const { id } = useParams<{ id: string }>();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getPlace(id), getPlacePosts(id, 1, 20)])
      .then(([placeData, postsData]) => {
        if (cancelled) return;
        setPlace(placeData);
        setPosts(postsData?.data ?? placeData?.posts ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load place:', err);
        setError('This place could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <PageShell
      eyebrow="Location"
      title={place?.name ?? 'Place'}
      description={place?.address ?? undefined}
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : error ? (
        <p className="text-dark-500 dark:text-dark-400">{error}</p>
      ) : (
        <div className="space-y-6">
          {(place?.latitude != null || place?.address) && (
            <div className="flex items-start gap-3 rounded-lg border border-dark-200 p-4 dark:border-dark-700">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
              <div>
                <p className="font-semibold">{place?.name}</p>
                {place?.address && (
                  <p className="text-sm text-dark-500 dark:text-dark-400">{place.address}</p>
                )}
                {place?.latitude != null && place?.longitude != null && (
                  <p className="text-xs text-dark-400">
                    {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          )}
          <h2 className="text-xl font-bold">Posts at this place</h2>
          {posts.length > 0 ? (
            <PostList posts={posts} />
          ) : (
            <p className="text-dark-500 dark:text-dark-400">No posts yet at this place.</p>
          )}
        </div>
      )}
    </PageShell>
  );
}
