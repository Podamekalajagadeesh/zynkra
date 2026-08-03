import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createThread,
  deleteThread,
  deleteThreadMessage,
  getThread,
  getThreads,
  sendThreadMessage,
} from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../contexts/ToastContext';
import { useUser } from '../hooks/useUser';
import { ArrowLeft, GitBranch, MessageSquare, Plus, Trash2 } from 'lucide-react';

interface ThreadMessageItem {
  id: string;
  threadId: string;
  userId: string;
  parentMessageId: string | null;
  content: string;
  createdAt: string;
  user?: { id: string; username?: string; displayName?: string };
}

interface ThreadItem {
  id: string;
  title: string | null;
  userId: string;
  createdAt: string;
  messageCount?: number;
  lastMessageAt?: string;
  user?: { id: string; username?: string; displayName?: string };
  messages?: ThreadMessageItem[];
}

const displayName = (u?: { username?: string; displayName?: string }) =>
  u?.displayName || u?.username || 'unknown';

const timeAgo = (iso: string) => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function ThreadsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useUser();

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [thread, setThread] = useState<ThreadItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rootDraft, setRootDraft] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    try {
      setThreads(await getThreads());
    } catch (error) {
      addToast('Failed to load threads', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const loadThread = useCallback(
    async (threadId: string) => {
      try {
        setThread(await getThread(threadId));
      } catch (error) {
        addToast('Failed to load thread', 'error');
      } finally {
        setLoading(false);
      }
    },
    [addToast],
  );

  useEffect(() => {
    if (id) {
      void loadThread(id);
    } else {
      void loadThreads();
    }
  }, [id, loadThread, loadThreads]);

  const handleCreate = async () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    setSubmitting(true);
    try {
      const created = await createThread({
        title: newTitle.trim() || undefined,
        content: newContent.trim() || undefined,
      });
      addToast('Thread created', 'success');
      setNewTitle('');
      setNewContent('');
      navigate(`/threads/${created.id}`);
    } catch (error) {
      addToast('Failed to create thread', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRootMessage = async () => {
    if (!thread || !rootDraft.trim()) return;
    try {
      await sendThreadMessage(thread.id, { content: rootDraft.trim() });
      setRootDraft('');
      await loadThread(thread.id);
    } catch (error) {
      addToast('Failed to post message', 'error');
    }
  };

  const handleReply = async (messageId: string) => {
    const content = (replyDrafts[messageId] || '').trim();
    if (!thread || !content) return;
    try {
      await sendThreadMessage(thread.id, { content, parentMessageId: messageId });
      setReplyDrafts((drafts) => ({ ...drafts, [messageId]: '' }));
      setReplyingTo(null);
      await loadThread(thread.id);
    } catch (error) {
      addToast('Failed to post reply', 'error');
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      await deleteThread(threadId);
      addToast('Thread deleted', 'success');
      if (id) {
        navigate('/threads');
      } else {
        setThreads((list) => list.filter((t) => t.id !== threadId));
      }
    } catch (error) {
      addToast('Failed to delete thread', 'error');
    }
  };

  const handleDeleteMessage = async (threadId: string, messageId: string) => {
    try {
      await deleteThreadMessage(threadId, messageId);
      addToast('Message deleted', 'success');
      await loadThread(threadId);
    } catch (error) {
      addToast('Failed to delete message', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-bold mb-4">Threads</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (id) {
    return (
      <div className="container mx-auto max-w-3xl p-4">
        <Link to="/threads" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> All threads
        </Link>

        {thread && (
          <>
            <div className="mt-4 flex items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold">{thread.title || 'Untitled thread'}</h1>
                <p className="text-sm text-gray-500">
                  Started by {displayName(thread.user)} · {timeAgo(thread.createdAt)}
                </p>
              </div>
              {user?.id === thread.userId && (
                <Button variant="destructive" size="sm" onClick={() => handleDeleteThread(thread.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              )}
            </div>

            <div className="mt-6 space-y-2">
              {(thread.messages || []).filter((m) => m.parentMessageId === null).map((root) => (
                <MessageBranch
                  key={root.id}
                  message={root}
                  all={thread.messages || []}
                  currentUserId={user?.id}
                  replyingTo={replyingTo}
                  replyDrafts={replyDrafts}
                  onReplyToggle={(messageId) => setReplyingTo(replyingTo === messageId ? null : messageId)}
                  onReplyDraftChange={(messageId, value) =>
                    setReplyDrafts((drafts) => ({ ...drafts, [messageId]: value }))
                  }
                  onReply={handleReply}
                  onDelete={(messageId) => handleDeleteMessage(thread.id, messageId)}
                />
              ))}
              {(thread.messages || []).length === 0 && (
                <p className="text-gray-500 py-8 text-center">No messages yet. Start the conversation.</p>
              )}
            </div>

            <div className="mt-6 border-t border-dark-200 pt-4">
              <Textarea
                placeholder="Add a message to this thread..."
                value={rootDraft}
                onChange={(e) => setRootDraft(e.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <Button onClick={handleRootMessage} disabled={!rootDraft.trim()}>
                  <Plus className="w-4 h-4 mr-1" /> Post
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <div className="flex items-center gap-2 mb-6">
        <GitBranch className="w-8 h-8" />
        <h1 className="text-2xl font-bold">Threads</h1>
        <span className="text-sm text-gray-500">({threads.length})</span>
      </div>

      <div className="mb-8 rounded-xl border border-dark-200 bg-white/80 dark:bg-dark-800 p-4">
        <h2 className="font-semibold mb-3">Start a new thread</h2>
        <Input
          placeholder="Topic title (optional)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="mb-3"
        />
        <Textarea
          placeholder="First message..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={handleCreate} disabled={submitting || (!newTitle.trim() && !newContent.trim())}>
            <MessageSquare className="w-4 h-4 mr-1" /> Start thread
          </Button>
        </div>
      </div>

      {threads.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No threads yet. Start the first one above.</p>
      ) : (
        <ul className="space-y-3">
          {threads.map((threadItem) => (
            <li
              key={threadItem.id}
              className="rounded-xl border border-dark-200 bg-white/80 dark:bg-dark-800 p-4 hover:border-primary-300 transition-colors"
            >
              <Link to={`/threads/${threadItem.id}`} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{threadItem.title || 'Untitled thread'}</h3>
                    <p className="text-sm text-gray-500">
                      {displayName(threadItem.user)} · {threadItem.messageCount ?? 0} messages ·{' '}
                      {threadItem.lastMessageAt ? timeAgo(threadItem.lastMessageAt) : timeAgo(threadItem.createdAt)}
                    </p>
                  </div>
                  {user?.id === threadItem.userId && (
                    <button
                      aria-label="Delete thread"
                      className="text-gray-400 hover:text-red-500"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteThread(threadItem.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MessageBranch({
  message,
  all,
  currentUserId,
  replyingTo,
  replyDrafts,
  onReplyToggle,
  onReplyDraftChange,
  onReply,
  onDelete,
}: {
  message: ThreadMessageItem;
  all: ThreadMessageItem[];
  currentUserId?: string;
  replyingTo: string | null;
  replyDrafts: Record<string, string>;
  onReplyToggle: (messageId: string) => void;
  onReplyDraftChange: (messageId: string, value: string) => void;
  onReply: (messageId: string) => void;
  onDelete: (messageId: string) => void;
}) {
  const children = all.filter((m) => m.parentMessageId === message.id);
  return (
    <div className="rounded-xl border border-dark-200 bg-white/80 dark:bg-dark-800 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm">
          <span className="font-semibold">{displayName(message.user)}</span>
          <span className="text-gray-400"> · {timeAgo(message.createdAt)}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            className="text-xs text-gray-500 hover:text-primary-600 inline-flex items-center gap-1"
            onClick={() => onReplyToggle(message.id)}
          >
            <GitBranch className="w-3 h-3" /> Reply
          </button>
          {currentUserId === message.userId && (
            <button
              aria-label="Delete message"
              className="text-gray-400 hover:text-red-500"
              onClick={() => onDelete(message.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{message.content}</p>

      {replyingTo === message.id && (
        <div className="mt-3">
          <Textarea
            placeholder="Branch off this message..."
            value={replyDrafts[message.id] || ''}
            onChange={(e) => onReplyDraftChange(message.id, e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={() => onReply(message.id)} disabled={!replyDrafts[message.id]?.trim()}>
              Reply
            </Button>
          </div>
        </div>
      )}

      {children.length > 0 && (
        <div className="mt-3 ml-4 border-l border-dark-200 pl-4 space-y-3">
          {children.map((child) => (
            <MessageBranch
              key={child.id}
              message={child}
              all={all}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              replyDrafts={replyDrafts}
              onReplyToggle={onReplyToggle}
              onReplyDraftChange={onReplyDraftChange}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
