import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { usePresence } from '../../hooks/usePresence';
import { PresenceDot } from '../PresenceDot';
import { Skeleton } from '../ui/skeleton';
import { getConversations, markConversationAsRead } from '../../lib/api';
import { MessageSquare } from 'lucide-react';

interface Participant {
  id: string;
  username?: string;
  email?: string;
  displayName?: string;
}

export interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount?: number;
}

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedId?: string;
}

export const ConversationList = ({ onSelectConversation, selectedId }: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Failed to fetch conversations', error);
        addToast('Failed to load conversations', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [addToast]);

  const participantIds = useMemo(
    () => [...new Set(conversations.flatMap((c) => c.participants.map((p) => p.id)))],
    [conversations],
  );
  const { isOnline } = usePresence(participantIds);
  const { activeAccount } = useAuth();
  const currentUserId = activeAccount?.user.id;

  const otherParticipantOnline = (conv: Conversation) =>
    conv.participants.some((p) => p.id !== currentUserId && isOnline(p.id));

  const getConversationName = (conv: Conversation) => {
    return conv.participants.map((p) => p.displayName || p.username || p.email || 'Unknown').join(', ');
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    onSelectConversation(conversation);
    if (!conversation.unreadCount) return;

    try {
      await markConversationAsRead(conversation.id);
      setConversations((current) => current.map((item) => (
        item.id === conversation.id ? { ...item, unreadCount: 0 } : item
      )));
    } catch (error) {
      console.error('Failed to mark conversation as read', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white border-r border-dark-200">
        <div className="p-lg border-b border-dark-200">
          <h2 className="text-lg font-bold text-dark-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 p-md">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={80} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white border-r border-dark-200">
      <div className="p-lg border-b border-dark-200 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-bold text-dark-900">Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-lg text-center">
            <MessageSquare size={48} className="text-dark-300 mb-md" />
            <p className="text-dark-600 font-medium">No conversations yet</p>
            <p className="text-sm text-dark-500">Start messaging someone to begin</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-md rounded-lg text-left transition-colors ${
                  selectedId === conv.id
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-dark-50 border border-transparent'
                }`}
              >
                <p className="font-medium text-dark-900 truncate flex items-center gap-xs">
                  {getConversationName(conv)}
                  <PresenceDot online={otherParticipantOnline(conv)} />
                </p>
                {conv.lastMessage && (
                  <p className="text-sm text-dark-500 truncate mt-xs">
                    {conv.lastMessage.content}
                  </p>
                )}
                {Boolean(conv.unreadCount) && (
                  <span className="mt-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};