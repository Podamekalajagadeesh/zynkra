import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PostList } from './post-list';
import { getPosts, getUserProfile, getUserPosts } from '../lib/api';
import { Post, ScreenshotProtectionLevel } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { useScreenshotProtection } from '../hooks/useScreenshotProtection';
import Avatar from './ui/avatar';
import { GiftButton } from './monetization/GiftButton';

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // Apply screenshot protection if enabled for profile
  const shouldApplyProtection = user?.screenshotProtection?.enabled && user.screenshotProtection?.applyToProfile;
  
  const { protectionRef } = useScreenshotProtection({
    enabled: shouldApplyProtection,
    level: (user?.screenshotProtection?.level as ScreenshotProtectionLevel) || ScreenshotProtectionLevel.WARNING_ONLY,
    contentTitle: 'this user profile',
  });

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      try {
        const fetchedUser = await getUserProfile(userId);
        setUser(fetchedUser);
        const fetchedPosts = await getUserPosts(userId);
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Failed to fetch user and posts:', error);
      }
    };

    fetchUserAndPosts();
  }, [userId]);

  const handleFollow = (userId: string) => {
    // Add follow logic here
  };

  const handleUnfollow = (userId: string) => {
    // Add unfollow logic here
  };

  const handleDelete = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div ref={protectionRef} className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <Avatar name={user.displayName || user.username} size={160} />
        <div className="ml-4">
          <h1 className="text-2xl font-bold">{user.displayName || user.username}</h1>
          <p className="text-gray-500">@{user.username}</p>
          <p className="mt-2 text-gray-600">{user.bio}</p>
          {currentUser?.id !== userId && (
            <div className="mt-4">
              <GiftButton recipientId={userId} />
            </div>
          )}
          {user.relationshipStatus && (
            <p className="mt-2 text-gray-600">
              <strong>Relationship Status:</strong> {user.relationshipStatus}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 border-t border-gray-200 pt-4">
        <h2 className="text-xl font-bold">Posts</h2>
      </div>
      <PostList
        posts={posts}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        onDelete={handleDelete}
        hideFollowButton={currentUser?.id === userId}
      />
      {user.lifeEvents && user.lifeEvents.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h2 className="text-xl font-bold">Life Events</h2>
          <div className="space-y-4">
            {user.lifeEvents.map((event: any) => (
              <div key={event.id} className="p-4 border rounded">
                <h3 className="font-bold">{event.title}</h3>
                <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                <p>{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}