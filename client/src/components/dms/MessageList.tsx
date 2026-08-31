import { useEffect, useState, useRef, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Skeleton } from '../ui/skeleton';
import Avatar from '../ui/avatar';
import { getMessages, addReaction, markMessageAsRead, getProfile, getConversations, forwardMessage } from '../../lib/api';
import { Smile, CornerUpLeft, CheckCheck, Send } from 'lucide-react';
import { Message, Conversation, ScreenshotProtectionLevel } from '../../lib/types';
import { formatDateTime } from '../../lib/preferences';
import MessageContent from './MessageContent';
import { useAuth } from '../../contexts/AuthContext';
import { useScreenshotProtection } from '../../hooks/useScreenshotProtection';

interface MessageListProps {
  conversationId?: string;
  channelId?: string;
  onReply: (message: Message) => void;
}

export const getReadReceiptLabel = (isRead: boolean) =>
  isRead ? 'Read by recipient' : 'Sent';

export const MessageList = ({
  conversationId,
  channelId,
  onReply,
}: MessageListProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const endRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver>();
  const [me, setMe] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  
  // Load current user's profile to check screenshot protection settings
  useEffect(() => {
    getProfile().then(setMe);
  }, []);
  
  // Apply screenshot protection if enabled for DMs
  const shouldApplyProtection = me?.screenshotProtection?.enabled && me.screenshotProtection?.applyToDms;
  
  const { protectionRef } = useScreenshotProtection({
    enabled: shouldApplyProtection,
    level: (me?.screenshotProtection?.level as ScreenshotProtectionLevel) || ScreenshotProtectionLevel.WARNING_ONLY,
    contentTitle: 'this direct message conversation',
  });

  const handleReadReceipt = (messageId: string) => {
    markMessageAsRead(messageId).catch((err) => {
      console.error('Failed to mark message as read', err);
    });
  };

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              handleReadReceipt(messageId);
            }
          }
        });
      },
      { threshold: 1.0 },
    );

    return () => {
      observer.current?.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMessages(conversationId, channelId);
      // Messages are decrypted in MessageContent component via the E2EE service
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to fetch messages', error);
      addToast('Failed to load messages', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, channelId, addToast, user]);

  useEffect(() => {
    if (!conversationId && !channelId) return;

    setIsLoading(true);
    fetchMessages();
  }, [conversationId, channelId, fetchMessages]);

  useEffect(() => {
    getConversations().then(setConversations);
  }, []);

  const handleAddReaction = async (messageId: string, reaction: string) => {
    try {
      await addReaction(messageId, reaction);
      fetchMessages();
      setShowReactions(null);
    } catch (error) {
      console.error('Failed to add reaction', error);
      addToast('Failed to add reaction', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-dark-50 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-md p-lg">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={60} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-dark-50 overflow-hidden">
      <div ref={protectionRef} className="flex-1 overflow-y-auto space-y-md p-lg">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-dark-600 font-medium">No messages yet</p>
              <p className="text-sm text-dark-500">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender.id === user?.id;
            const reactions = (msg.reactions ?? []).reduce(
              (acc, reaction) => {
                acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>,
            );
            const isRead =
              msg.readBy.length > 0 &&
              msg.readBy.some((r) => r.user.id !== user?.id);

            return (
              <div
                key={msg.id}
                data-message-id={msg.id}
                ref={(el) => {
                  if (el && !isOwn) {
                    observer.current?.observe(el);
                  }
                }}
                className={`flex gap-sm group ${
                  isOwn ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isOwn && (
                  <Avatar
                    name={msg.sender.username || msg.sender.email || 'U'}
                    size={32}
                  />
                )}
                <div
                  className={`relative max-w-xs lg:max-w-md px-md py-sm rounded-lg ${
                    isOwn
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-white text-dark-900 border border-dark-200 rounded-bl-none'
                  }`}
                >
                  <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 flex">
                    <button
                      onClick={() =>
                        setShowReactions(
                          showReactions === msg.id ? null : msg.id,
                        )
                      }
                    >
                      <Smile size={16} />
                    </button>
                    <button onClick={() => onReply(msg)}>
                      <CornerUpLeft size={16} />
                    </button>
                    <button onClick={() => setForwardingMessage(msg)}>
                      <Send size={16} />
                    </button>
                  </div>
                  {showReactions === msg.id && (
                    <div className="absolute top-[-30px] right-0 bg-white border rounded-lg p-1 flex gap-1">
                      {['👍', '❤️', '😂', '😢', '😡'].map((r) => (
                        <button
                          key={r}
                          onClick={() => handleAddReaction(msg.id, r)}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                  {forwardingMessage && (
                    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="bg-white p-4 rounded-lg">
                        <h3 className="text-lg font-bold">Forward Message</h3>
                        <ul className="mt-4">
                          {conversations.map((conv) => (
                            <li
                              key={conv.id}
                              className="cursor-pointer hover:bg-gray-200 p-2 rounded-lg"
                              onClick={async () => {
                                if (forwardingMessage) {
                                  await forwardMessage(
                                    forwardingMessage.id,
                                    conv.id,
                                  );
                                  setForwardingMessage(null);
                                  addToast('Message forwarded', 'success');
                                }
                              }}
                            >
                              {conv.name ||
                                conv.participants
                                  .map((p) => p.username || p.email)
                                  .join(', ')}
                            </li>
                          ))}
                        </ul>
                        <button
                          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg"
                          onClick={() => setForwardingMessage(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {msg.replyTo && (
                    <div className="text-xs bg-gray-200 p-2 rounded-lg mb-2">
                      <p className="font-semibold">
                        {msg.replyTo.sender.username ||
                          msg.replyTo.sender.email}
                      </p>
                      <p>{msg.replyTo.content}</p>
                    </div>
                  )}
                  {!isOwn && (
                    <p className="text-xs font-semibold mb-xs opacity-70">
                      {msg.sender.username || msg.sender.email}
                    </p>
                  )}
                  <MessageContent message={msg} />
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs mt-xs ${
                        isOwn ? 'text-white/70' : 'text-dark-500'
                      }`}
                    >
                      {formatDateTime(msg.createdAt, { timeStyle: 'short' })}
                    </p>
                    {isOwn && (
                      <div
                        className="flex items-center"
                        title={getReadReceiptLabel(isRead)}
                        aria-label={getReadReceiptLabel(isRead)}
                      >
                        <CheckCheck
                          size={16}
                          className={isRead ? 'text-blue-500' : 'text-gray-400'}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {Object.entries(reactions).map(([r, count]) => (
                      <div
                        key={r}
                        className="bg-gray-200 text-xs rounded-full px-2 py-1"
                      >
                        {r} {count}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};