import { useState } from 'react';
import { PostCard } from './post-card';
import EmptyState from './ui/empty-state';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AddToCollectionModal } from './AddToCollectionModal';

interface PostAuthor {
  id: string;
  email: string | null;
  walletAddress: string | null;
}

interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  user: PostAuthor;
  likes: Array<{ id: string; user: { id: string } }>;
  comments: Array<{ id: string; content: string; createdAt: string; user: PostAuthor }>;
  bookmarked?: boolean;
}

interface PostListProps {
  posts: Post[];
  onFollow: (userId: string) => void;
  onUnfollow: (userId: string) => void;
  onDelete: (postId: string) => void;
  hideFollowButton?: boolean;
}

export function PostList({ posts, onFollow, onUnfollow, onDelete, hideFollowButton }: PostListProps) {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const isFollowing = (userId: string) => {
    if (!currentUser) return false;
    return currentUser.following.some((followedUser) => followedUser.id === userId);
  };

  const handleSaveClick = (postId: string) => {
    setSelectedPostId(postId);
    setIsModalOpen(true);
  };

  return (
    <div role="feed" aria-label="Posts feed">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          onFollow={onFollow}
          onUnfollow={onUnfollow}
          onDelete={onDelete}
          onSave={handleSaveClick}
          isFollowing={isFollowing(post.user.id)}
          hideFollowButton={hideFollowButton}
        />
      ))}
      {posts.length === 0 && (
        <div className="card p-xl text-center">
          <EmptyState
            icon={<MessageSquare size={48} />}
            title="No posts yet"
            description="Follow users or create your first post to get started!"
          />
        </div>
      )}
      {selectedPostId && (
        <AddToCollectionModal
          postId={selectedPostId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}