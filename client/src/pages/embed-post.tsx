import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPost } from '../lib/api';
import { Post } from '../lib/types';

// Minimal, dependency-free post view for oEmbed iframes. No app shell, no auth
// required — styled to stand alone on third-party pages.
export default function EmbedPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPost(id)
      .then(setPost)
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#6b7280' }}>
        This post is unavailable or was removed.
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#6b7280' }}>
        Loading post…
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '0 auto',
        padding: 20,
        fontFamily: 'system-ui, sans-serif',
        color: '#111827',
        background: '#ffffff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {(post.user?.displayName || post.user?.username || '?').slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {post.user?.displayName || post.user?.username || 'Unknown'}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {new Date(post.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
        {post.content || '(no text)'}
      </p>

      {post.media && post.media.length > 0 && (
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          {post.media.map((m, i) =>
            m.type === 'video' ? (
              <video key={i} src={m.url} controls style={{ width: '100%', borderRadius: 8 }} />
            ) : (
              <img key={i} src={m.url} alt="" style={{ width: '100%', borderRadius: 8, maxHeight: 320, objectFit: 'cover' }} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
