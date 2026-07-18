import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageConversation, PageMessage } from '../../lib/types';
import { getPageConversation } from '../../lib/api';
import { PageSendMessageForm } from './PageSendMessageForm';
import io from 'socket.io-client';

interface PageMessageListProps {
  conversation: PageConversation;
}

const socket = io('http://localhost:3000/page-inbox');

export function PageMessageList({ conversation }: PageMessageListProps) {
  const { pageId } = useParams<{ pageId: string }>();
  const [messages, setMessages] = useState<PageMessage[]>([]);

  useEffect(() => {
    if (conversation) {
      getPageConversation(pageId!, conversation.id).then((fullConversation) => {
        setMessages(fullConversation.messages);
      });

      socket.emit('joinConversation', conversation.id);

      socket.on('newMessage', (message: PageMessage) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      return () => {
        socket.emit('leaveConversation', conversation.id);
        socket.off('newMessage');
      };
    }
  }, [conversation, pageId]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4">
            <p className="font-bold">{message.sender.username}</p>
            <p>{message.content}</p>
            <p className="text-xs text-gray-500">{new Date(message.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <PageSendMessageForm conversationId={conversation.id} />
    </div>
  );
}