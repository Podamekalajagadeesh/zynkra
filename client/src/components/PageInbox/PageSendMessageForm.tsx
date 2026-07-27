import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { createPageMessage } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useE2EE } from '../../hooks/useE2EE';

interface PageSendMessageFormProps {
  conversationId: string;
  recipientId?: string;
}

export function PageSendMessageForm({ conversationId, recipientId }: PageSendMessageFormProps) {
  const { pageId } = useParams<{ pageId: string }>();
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const { encryptMessage, isReady: e2eeReady } = useE2EE(user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() === '') return;

    let contentToSend = content;
    if (recipientId && user && e2eeReady) {
      try {
        contentToSend = await encryptMessage(recipientId, content);
      } catch {
        console.warn('E2EE encrypt failed, sending plaintext');
      }
    }

    await createPageMessage(pageId!, conversationId, contentToSend);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full rounded border p-2"
        placeholder="Type a message..."
      />
    </form>
  );
}
