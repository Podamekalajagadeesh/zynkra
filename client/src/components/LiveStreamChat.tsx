import { useState, useEffect, useRef, FormEvent } from 'react';
import { io, Socket } from 'socket.io-client';

interface StreamComment {
  id: string;
  content: string;
  user: { id: string; username: string };
}

interface LiveStreamChatProps {
  streamId: string;
  userId: string;
}

const LiveStreamChat = ({ streamId, userId }: LiveStreamChatProps) => {
  const [messages, setMessages] = useState<StreamComment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:3001');

    socketRef.current.emit('join-room', streamId);
    socketRef.current.emit('get-comments', streamId);

    socketRef.current.on('comments', (comments: StreamComment[]) => {
      setMessages(comments);
    });

    socketRef.current.on('new-comment', (comment: StreamComment) => {
      setMessages((prevMessages) => [...prevMessages, comment]);
    });

    socketRef.current.on('comment-deleted', (commentId: string) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== commentId)
      );
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [streamId]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socketRef.current?.emit('new-comment', {
        content: newMessage,
        streamId,
        userId,
      });
      setNewMessage('');
    }
  };

  const handleDeleteMessage = (commentId: string) => {
    socketRef.current?.emit('delete-comment', { commentId, userId });
  };

  return (
    <div>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <span>
              {msg.user.username}: {msg.content}
            </span>
            {msg.user.id === userId && (
              <button onClick={() => handleDeleteMessage(msg.id)}>
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default LiveStreamChat;