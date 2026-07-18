import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile, followUser, unfollowUser, startConversation, blockUser, unblockUser, sendFollowRequest, addFavorite, removeFavorite } from '../lib/api';
import { PostList } from '../components/post-list';
import { SubscribeButton } from '../components/SubscribeButton';
import { UserProfile } from '../lib/types';
import { PageShell } from '../components/PageShell';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { MessageSquare, ShieldOff, Star } from 'lucide-react';
import { MutualFollows } from '../components/MutualFollows';

export function UserPage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, setUser: setCurrentUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [followStatus, setFollowStatus] = useState<'following' | 'requested' | 'not_following'>('not_following');
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        const fetchedUser = await getUserProfile(id, 10, 0);
        const normalized = {
          ...fetchedUser,
          posts: fetchedUser.posts ?? [],
          following: fetchedUser.following ?? [],
        };
        setUser(normalized);
        if (currentUser?.blockedUsers?.some((blockedUser) => blockedUser.id === id)) {
          setIsBlocked(true);
        }
        if (currentUser?.favorites?.some((favoriteUser) => favoriteUser.id === id)) {
          setIsFavorite(true);
        }
        if (currentUser?.following.some((f) => f.id === id)) {
          setFollowStatus('following');
        }
        if ((normalized.posts.length ?? 0) < 10) {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, currentUser]);

  const handleStartConversation = async () => {
    if (!user) return;
    try {
      const conversation = await startConversation(user.id);
      navigate(`/dms/conversations/${conversation.id}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      addToast('Failed to start conversation', 'error');
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser || !user) return;

    try {
      if (user.profilePrivacy === 'private') {
        await sendFollowRequest(userId);
        setFollowStatus('requested');
        addToast('Follow request sent!', 'success');
      } else {
        await followUser(userId);
        // Optimistically update the current user's following list
        const newFollowing = [...currentUser.following, { id: userId }];
        setCurrentUser({ ...currentUser, following: newFollowing });

        // Optimistically update the viewed user's followers list
        const newFollowers = [...(user.followers ?? []), { id: currentUser.id, email: currentUser.email, walletAddress: currentUser.walletAddress }];
        setUser({ ...user, followers: newFollowers });
        setFollowStatus('following');
        addToast('User followed!', 'success');
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
      addToast('Failed to follow user', 'error');
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!currentUser || !user) return;

    try {
      await unfollowUser(userId);
      // Optimistically update the current user's following list
      const newFollowing = currentUser.following.filter((u) => u.id !== userId);
      setCurrentUser({ ...currentUser, following: newFollowing });

      // Optimistically update the viewed user's followers list
      const newFollowers = (user.followers ?? []).filter((f) => f.id !== currentUser.id);
      setUser({ ...user, followers: newFollowers });
      setFollowStatus('not_following');
      addToast('User unfollowed', 'success');
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      addToast('Failed to unfollow user', 'error');
    }
  };

  const handleBlock = async () => {
    if (!user) return;
    try {
      await blockUser(user.id);
      setIsBlocked(true);
      addToast('User blocked', 'success');
    } catch (error) {
      console.error('Failed to block user:', error);
      addToast('Failed to block user', 'error');
    }
  };

  const handleUnblock = async () => {
    if (!user) return;
    try {
      await unblockUser(user.id);
      setIsBlocked(false);
      addToast('User unblocked', 'success');
    } catch (error) {
      console.error('Failed to unblock user:', error);
      addToast('Failed to unblock user', 'error');
    }
  };

  const handleFavorite = async () => {
    if (!user) return;
    try {
      await addFavorite(user.id);
      setIsFavorite(true);
      addToast('User added to favorites', 'success');
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      addToast('Failed to add to favorites', 'error');
    }
  };

  const handleUnfavorite = async () => {
    if (!user) return;
    try {
      await removeFavorite(user.id);
      setIsFavorite(false);
      addToast('User removed from favorites', 'success');
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      addToast('Failed to remove from favorites', 'error');
    }
  };

  const handleDelete = (postId: string) => {
    if (!user) return;
    setUser({
      ...user,
      posts: (user.posts ?? []).filter((p) => p.id !== postId),
    });
  };

  const loadMore = async () => {
    if (!id || !user) return;
    try {
      const newUser = await getUserProfile(id, 10, (user.posts ?? []).length);
      setUser({
        ...user,
        posts: [...(user.posts ?? []), ...(newUser.posts ?? [])],
      });
      if ((newUser.posts ?? []).length < 10) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to fetch more posts:', error);
    }
  };

  if (loading) {
    return (
      <PageShell
        eyebrow="Community"
        title="Loading profile..."
        description="Fetching user details and their posts."
        compact
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="surface-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-500">Posts</p>
            <Skeleton className="mt-2 h-8 w-12" />
          </div>
          <div className="surface-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-500">Following</p>
            <Skeleton className="mt-2 h-8 w-12" />
          </div>
          <div className="surface-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-500">Identity</p>
            <Skeleton className="mt-2 h-6 w-32" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell eyebrow="Error" title="User not found" description="This user could not be found." compact>
        <div className="surface-soft p-8 text-center">
          <p className="text-dark-600 dark:text-dark-300">The profile you are looking for does not exist.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Community"
      title={user.email || user.walletAddress || 'User profile'}
      description="Browse this user's posts and follow state with a more focused profile layout."
      compact
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="surface-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-500">Followers</p>
          <p className="mt-2 text-2xl font-semibold text-dark-900 dark:text-white">{user.followers?.length ?? 0}</p>
        </div>
        <div className="surface-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-500">Identity</p>
          <p className="mt-2 truncate text-sm font-medium text-dark-900 dark:text-white">
            {user.walletAddress || user.email || 'Anonymous'}
          </p>
        </div>
      </div>

      {currentUser && currentUser.id === user.id && (
        <div className="mb-5">
          <Button variant="outline" onClick={() => navigate('/blocked-users')}>
            Blocked Users
          </Button>
        </div>
      )}

      {currentUser && currentUser.id !== user.id && (
        <div className="mb-5">
          <MutualFollows userId={user.id} />
        </div>
      )}

      {currentUser && currentUser.id !== user.id && (
        <div className="mb-5 flex flex-col gap-2">
          <SubscribeButton creatorId={user.id} />
          <div className="flex w-full gap-2">
            {followStatus === 'following' ? (
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => handleUnfollow(user.id)}
              >
                Unfollow
              </Button>
            ) : followStatus === 'requested' ? (
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                disabled
              >
                Requested
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => handleFollow(user.id)}
              >
                {user.profilePrivacy === 'private' ? 'Request to Follow' : 'Follow'}
              </Button>
            )}
            {isFavorite ? (
              <Button variant="secondary" size="sm" onClick={handleUnfavorite}>
                <Star fill="gold" />
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={handleFavorite}>
                <Star />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleStartConversation}>
              <MessageSquare />
            </Button>
            {isBlocked ? (
              <Button variant="destructive" size="sm" onClick={handleUnblock}>
                <ShieldOff />
              </Button>
            ) : (
              <Button variant="destructive" size="sm" onClick={handleBlock}>
                <ShieldOff />
              </Button>
            )}
          </div>
        </div>
      )}

      <PostList
        posts={user.posts ?? []}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        onDelete={handleDelete}
        hideFollowButton
      />

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            className="rounded-xl border border-dark-200 bg-white px-5 py-3 font-medium text-dark-900 shadow-sm transition-colors hover:bg-dark-50 dark:border-dark-700 dark:bg-dark-800 dark:text-white dark:hover:bg-dark-700"
          >
            Load More
          </button>
        </div>
      )}
    </PageShell>
  );
}