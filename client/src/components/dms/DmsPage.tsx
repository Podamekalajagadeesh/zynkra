import { useEffect, useState } from 'react';
import { ConversationList } from './ConversationList';
import { MessageList } from './MessageList';
import { SendMessageForm } from './SendMessageForm';
import { MessageSquare } from 'lucide-react';
import { PageShell } from '../PageShell';
import { CreateGroupDm } from './CreateGroupDm';
import { Conversation } from './ConversationList';
import { getProfile, getPosts } from '../../lib/api';
import { PostAuthor, Message } from '../../lib/types';
import { NotesBar } from '../notes/NotesBar';

export const DmsPage = () => {
  const [selectedConversation, setSelectedConversation] = useState<
    Conversation | null
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [users, setUsers] = useState<PostAuthor[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  useEffect(() => {
    // A bit of a hack to get some users to select from.
    // In a real app, you'd probably have a dedicated user search endpoint.
    getPosts().then((posts) => {
      const users = posts.map((p) => p.user);
      const uniqueUsers = Array.from(new Set(users.map((u) => u.id))).map(
        (id) => {
          return users.find((u) => u.id === id);
        },
      );
      getProfile().then((me) => {
        setUsers(uniqueUsers.filter((u): u is PostAuthor => !!u && u.id !== me.id));
      });
    });
  }, []);

  const handleMessageSent = () => {
    setRefreshKey((prev) => prev + 1);
    setReplyTo(null);
  };

  const handleGroupCreated = () => {
    setShowCreateGroup(false);
    setRefreshKey((prev) => prev + 1);
  };

  const [me, setMe] = useState<PostAuthor | null>(null);

  useEffect(() => {
    getProfile().then(setMe);
  }, []);

  const recipient = selectedConversation?.participants.find(p => p.id !== me?.id);

  return (
    <PageShell
      eyebrow="Direct messages"
      title="Conversations"
      description="A focused inbox for private conversations, designed to feel calm and responsive on every device."
      contentClassName="overflow-hidden p-0"
    >
      <div className="grid min-h-[72vh] grid-cols-1 overflow-hidden lg:grid-cols-[340px_1fr]">
        <div className="border-b border-dark-200 bg-white/70 lg:border-b-0 lg:border-r dark:border-dark-700 dark:bg-dark-900/70">
          <div className="p-4">
            <button
              onClick={() => setShowCreateGroup(!showCreateGroup)}
              className="w-full bg-primary-500 text-white p-2 rounded"
            >
              {showCreateGroup ? 'Cancel' : 'Create Group DM'}
            </button>
            {showCreateGroup && (
              <CreateGroupDm
                users={users as User[]}
                onGroupCreated={handleGroupCreated}
              />
            )}
          </div>
          <NotesBar />
          <ConversationList
            key={refreshKey}
            onSelectConversation={setSelectedConversation}
            selectedId={selectedConversation?.id}
          />
        </div>

        <div className="flex min-h-[60vh] flex-col overflow-hidden bg-dark-50/70 dark:bg-dark-900/40">
          {selectedConversation ? (
            <>
              <MessageList
                key={refreshKey}
                conversationId={selectedConversation.id}
                onReply={setReplyTo}
              />
              <SendMessageForm
                conversationId={selectedConversation.id}
                recipientId={recipient?.id}
                onMessageSent={handleMessageSent}
                replyTo={replyTo}
                onClearReply={() => setReplyTo(null)}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-300">
                <MessageSquare size={36} />
              </div>
              <h2 className="section-title mb-3 text-3xl">
                Select a conversation
              </h2>
              <p className="section-subtitle max-w-sm">
                Choose a conversation from the list to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};