import { Thread, Community } from '../../lib/types';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Pin } from 'lucide-react';
import { Flair } from './Flair';
import { Avatar } from '../Avatar';

interface ThreadListProps {
  threads: Thread[];
  community: Community;
  onSelectThread: (id: string) => void;
  onVote: (threadId: string, voteType: 'up' | 'down') => void;
  userVotes: { [threadId: string]: 'up' | 'down' | null };
}

export const ThreadList = ({ threads, community, onSelectThread, onVote, userVotes }: ThreadListProps) => {
  // Sort threads: pinned/megathreads first, then by score
  const sortedThreads = [...threads].sort((a, b) => {
    if (a.isPinned || a.isMegathread) return -1;
    if (b.isPinned || b.isMegathread) return 1;
    const scoreA = a.upvotes.length - a.downvotes.length;
    const scoreB = b.upvotes.length - b.downvotes.length;
    return scoreB - scoreA;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">r/{community.name}</h2>
          <p className="text-sm text-dark-500 dark:text-dark-400">{community.description}</p>
        </div>
      </div>
      {sortedThreads.map((thread) => (
        <div
          key={thread.id}
          className="p-4 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectThread(thread.id)}
        >
          <div className="flex gap-4">
            {/* Vote buttons */}
            <div className="flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onVote(thread.id, 'up')}
                className={`p-1 rounded hover:bg-dark-100 dark:hover:bg-dark-700 ${
                  userVotes[thread.id] === 'up' ? 'text-orange-500' : ''
                }`}
              >
                <ArrowBigUp size={24} />
              </button>
              <span className="text-sm font-semibold">
                {formatNumber(thread.upvotes.length - thread.downvotes.length)}
              </span>
              <button
                onClick={() => onVote(thread.id, 'down')}
                className={`p-1 rounded hover:bg-dark-100 dark:hover:bg-dark-700 ${
                  userVotes[thread.id] === 'down' ? 'text-blue-500' : ''
                }`}
              >
                <ArrowBigDown size={24} />
              </button>
            </div>
            {/* Thread content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {(thread.isPinned || thread.isMegathread) && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                    <Pin size={12} />
                    {thread.isMegathread ? 'Megathread' : 'Pinned'}
                  </span>
                )}
                {thread.flairs.map((flair) => (
                  <Flair key={flair.id} flair={flair} />
                ))}
              </div>
              <h3 className="text-lg font-semibold mb-2">{thread.title}</h3>
              <p className="text-sm text-dark-600 dark:text-dark-300 line-clamp-2 mb-3">{thread.content}</p>
              {thread.media && thread.media.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {thread.media.slice(0, 3).map((media, idx) => (
                    <img
                      key={idx}
                      src={media.url}
                      alt=""
                      className="w-20 h-20 object-cover rounded"
                    />
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-dark-500 dark:text-dark-400">
                <div className="flex items-center gap-2">
                  <Avatar src={thread.createdBy.profile?.avatarUrl} size="sm" />
                  <span>u/{thread.createdBy.id}</span>
                </div>
                <span className="flex items-center gap-1">
                  <MessageSquare size={16} />
                  {thread.comments.length} comments
                </span>
                <span>{formatNumber(thread.viewCount)} views</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      {threads.length === 0 && (
        <div className="text-center py-12 text-dark-500 dark:text-dark-400">
          <p className="text-lg">No threads yet</p>
          <p className="text-sm">Be the first to start a discussion!</p>
        </div>
      )}
    </div>
  );
};