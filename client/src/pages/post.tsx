// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPost } from '../lib/api';
import { Share2 } from 'lucide-react';
import { PostCard } from '../components/post-card';
import { Post } from '../lib/types';
import { PageShell } from '../components/PageShell';
import { Skeleton } from '../components/ui/skeleton';
import { PostCollaborators } from '../components/PostCollaborators';
import { PostAnalytics } from '../components/PostAnalytics';
import { MoreLikeThis } from '../components/MoreLikeThis';

export function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Deep-link support: keep the page's canonical URL + OpenGraph tags pointed
  // at the stable /post/:id route so shared links preview correctly everywhere.
  useEffect(() => {
    if (!post) return;
    const url = `${window.location.origin}/post/${post.id}`;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[property="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    setMeta('og:title', post.user?.username ? `${post.user.username}'s post` : 'Zynkra post');
    setMeta('og:description', (post.content || '').slice(0, 200));
    setMeta('og:url', url);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [post]);

  const copyLink = async () => {
    if (!post) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (non-secure context) — silently ignore.
    }
  };

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
      <div className="flex justify-end mb-2">
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
      <PostCard
        post={post}
        currentUser={null}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        onDelete={handleDelete}
      />
      <PostCollaborators postId={post.id} collaborators={post.collaborators || []} authorId={post.user?.id} />
      <PostAnalytics postId={post.id} authorId={post.user?.id} />
      <MoreLikeThis postId={post.id} />
    </PageShell>
  );
}
