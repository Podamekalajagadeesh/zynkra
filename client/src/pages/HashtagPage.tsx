import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPostsByHashtag, followHashtag, unfollowHashtag, getProfile } from '../lib/api';
import { PostCard } from '../components/post-card';
import { PageShell } from '../components/PageShell';
import { Post, UserProfile } from '../lib/types';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (tag) {
      getPostsByHashtag(tag)
        .then(setPosts)
        .catch((err) => console.error('Failed to fetch posts by hashtag:', err))
        .finally(() => setLoading(false));

      getProfile()
        .then((userProfile) => {
          setProfile(userProfile);
          const followedHashtags = userProfile.followedHashtags || [];
          setIsFollowing(followedHashtags.some((ht) => ht.name === tag));
        })
        .catch((err) => console.error('Failed to fetch profile:', err));
    }
  }, [tag]);

  const handleFollowToggle = async () => {
    if (!tag) return;
    
    try {
      if (isFollowing) {
        await unfollowHashtag(tag);
        setIsFollowing(false);
        toast.success(`Unfollowed #${tag}`);
      } else {
        await followHashtag(tag);
        setIsFollowing(true);
        toast.success(`Following #${tag}`);
      }
    } catch (error) {
      console.error('Failed to update hashtag follow status:', error);
      toast.error('Failed to update follow status');
    }
  };

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">#{tag}</h1>
        {profile && (
          <Button 
            onClick={handleFollowToggle}
            variant={isFollowing ? "secondary" : "default"}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </Button>
        )}
      </div>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <p>No posts found for this hashtag.</p>
          )}
        </div>
      )}
    </PageShell>
  );
}