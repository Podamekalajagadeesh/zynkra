import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { createPageMessage, getPublicKey } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { encryptMessage, getKeys } from '../../services/encryption.service';

interface PageSendMessageFormProps {
  conversationId: string;
  recipientId?: string;
}

export function PageSendMessageForm({ conversationId, recipientId }: PageSendMessageFormProps) {
  const { pageId } = useParams<{ pageId: string }>();
  const [content, setContent] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() === '') return;
    
    let contentToSend = content;
    if (recipientId && user) {
      const recipientPublicKey = await getPublicKey(recipientId);
      if (recipientPublicKey) {
        const keys = await getKeys(user.id);
        if (keys) {
          const recipientPublicKeyBytes = new Uint8Array(atob(recipientPublicKey).split('').map(c => c.charCodeAt(0)));
          contentToSend = await encryptMessage(recipientPublicKeyBytes, keys.privateKey, content);
        }
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