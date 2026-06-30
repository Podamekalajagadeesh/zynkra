import { useState } from 'react';
import { Thread, Comment, Community } from '../../lib/types';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Pin, ArrowLeft } from 'lucide-react';
import { Flair } from './Flair';
import { Avatar } from '../Avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useNavigate } from 'react-router-dom';

interface ThreadDetailProps {
  thread: Thread;
  community: Community;
  onBack: () => void;
  onAddComment: (content: string, parentId?: string) => void;
  onVote: (voteType: 'up' | 'down') => void;
  userVote: 'up' | 'down' | null;
}

export const ThreadDetail = ({ thread, community, onBack, onAddComment, onVote, userVote }: ThreadDetailProps) => {
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment, replyToId || undefined);
      setNewComment('');
      setReplyToId(null);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Recursive comment renderer
  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-dark-200 dark:border-dark-700 pl-4' : ''} mb-4`}>
      <div className="flex items-start gap-3 mb-2">
        <Avatar src={comment.user.profile?.avatarUrl} size="sm" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">u/{comment.user.id}</span>
            <span className="text-xs text-dark-500">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
          <button
            onClick={() => setReplyToId(comment.id)}
            className="text-xs text-primary-500 mt-2 hover:underline"
          >
            Reply
          </button>
          {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-dark-600 dark:text-dark-300 hover:text-dark-900 dark:hover:text-white"
      >
        <ArrowLeft size={20} />
        Back to r/{community.name}
      </button>
      
      <div className="p-6 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 mb-6">
        <div className="flex gap-6">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onVote('up')}
              className={`p-2 rounded hover:bg-dark-100 dark:hover:bg-dark-700 ${
                userVote === 'up' ? 'text-orange-500' : ''
              }`}
            >
              <ArrowBigUp size={32} />
            </button>
            <span className="text-lg font-bold">
              {formatNumber(thread.upvotes.length - thread.downvotes.length)}
            </span>
            <button
              onClick={() => onVote('down')}
              className={`p-2 rounded hover:bg-dark-100 dark:hover:bg-dark-700 ${
                userVote === 'down' ? 'text-blue-500' : ''
              }`}
            >
              <ArrowBigDown size={32} />
            </button>
          </div>
          
          {/* Thread content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              {(thread.isPinned || thread.isMegathread) && (
                <span className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                  <Pin size={14} />
                  {thread.isMegathread ? 'Megathread' : 'Pinned'}
                </span>
              )}
              {thread.flairs.map((flair) => (
                <Flair key={flair.id} flair={flair} />
              ))}
            </div>
            <h1 className="text-2xl font-bold mb-4">{thread.title}</h1>
            <div className="flex items-center gap-3 mb-6 text-sm text-dark-500 dark:text-dark-400">
              <Avatar src={thread.createdBy.profile?.avatarUrl} size="sm" />
              <span>Posted by u/{thread.createdBy.id}</span>
              <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="prose dark:prose-invert max-w-none mb-6">
              <p className="whitespace-pre-wrap">{thread.content}</p>
            </div>
            {thread.media && thread.media.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {thread.media.map((media, idx) => (
                  media.type === 'image' ? (
                    <img key={idx} src={media.url} alt="" className="rounded-lg w-full object-cover" />
                  ) : (
                    <video key={idx} src={media.url} controls className="rounded-lg w-full" />
                  )
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-dark-500 dark:text-dark-400 border-t border-dark-200 dark:border-dark-700 pt-4">
              <span className="flex items-center gap-1">
                <MessageSquare size={18} />
                {thread.comments.length} comments
              </span>
              <span>{formatNumber(thread.viewCount)} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmitComment} className="mb-8 p-4 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800">
        {replyToId && (
          <div className="mb-3 flex items-center gap-2 text-sm">
            <span>Replying to a comment</span>
            <button
              type="button"
              onClick={() => setReplyToId(null)}
              className="text-primary-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="What are your thoughts?"
          className="mb-3 min-h-[100px]"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!newComment.trim()}>Comment</Button>
        </div>
      </form>

      {/* Comments section */}
      <div className="p-6 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800">
        <h3 className="text-lg font-semibold mb-6">{thread.comments.length} Comments</h3>
        {thread.comments.map((comment) => renderComment(comment))}
        {thread.comments.length === 0 && (
          <div className="text-center py-8 text-dark-500 dark:text-dark-400">
            <p>No comments yet. Be the first to share what you think!</p>
          </div>
        )}
      </div>
    </div>
  );
};