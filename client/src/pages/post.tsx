import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPost } from '../lib/api';
import { PostCard } from '../components/post-card';
import { Post } from '../lib/types';
import { PageShell } from '../components/PageShell';
import { Skeleton } from '../components/ui/skeleton';

export function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        const fetchedPost = await getPost(id);
        setPost(fetchedPost);
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <PageShell eyebrow="Post" title="Loading post" description="Fetching the conversation and media attached to this post.">
        <div className="space-y-4">
          <Skeleton height={88} />
          <Skeleton height={420} />
        </div>
      </PageShell>
    );
  }

  if (!post) {
    return (
      <PageShell eyebrow="Post" title="Post not found" description="The content may have been removed or the link is invalid.">
        <div className="text-center py-12">
          <p className="section-subtitle">Try returning to the feed.</p>
        </div>
      </PageShell>
    );
  }

  const handleFollow = (userId: string) => {
    if (!post) return;
    console.log('Followed user:', userId);
  };

  const handleUnfollow = (userId: string) => {
    if (!post) return;
    console.log('Unfollowed user:', userId);
  };

  const handleDelete = () => {
    if (!post) return;
    window.location.href = '/';
  };

  return (
    <PageShell
      eyebrow="Post detail"
      title="Conversation view"
      description="A focused page for reading, reacting, and engaging with a single post."
      compact
    >
      <PostCard
        post={post}
        currentUser={null}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        onDelete={handleDelete}
      />
    </PageShell>
  );
}
