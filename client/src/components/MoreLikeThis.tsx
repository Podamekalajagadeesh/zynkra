import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSimilarPosts } from '../lib/api';
import { Sparkles } from 'lucide-react';

interface SimilarPost {
  id: string;
  content: string;
  createdAt: string;
  user?: { id: string; username?: string; displayName?: string };
  media?: { url: string; type: string }[];
}

export function MoreLikeThis({ postId }: { postId: string }) {
  const [posts, setPosts] = useState<SimilarPost[]>([]);

  useEffect(() => {
    getSimilarPosts(postId, 6)
      .then(setPosts)
      .catch(() => setPosts([]));
  }, [postId]);

  if (posts.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary-500" />
        <h3 className="font-semibold">More like this</h3>
      </div>
      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              to={`/post/${post.id}`}
              className="block rounded-xl border border-dark-200 bg-white/80 p-3 transition-colors hover:border-primary-300 dark:bg-dark-800"
            >
              <p className="line-clamp-2 text-sm">{post.content || '(no text)'}</p>
              <p className="mt-1 text-xs text-gray-500">
                {post.user?.displayName || post.user?.username || 'unknown'}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
