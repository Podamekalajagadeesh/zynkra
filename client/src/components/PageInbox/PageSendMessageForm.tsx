import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { createPageMessage } from '../../lib/api';

interface PageSendMessageFormProps {
  conversationId: string;
}

export function PageSendMessageForm({ conversationId }: PageSendMessageFormProps) {
  const { pageId } = useParams<{ pageId: string }>();
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() === '') return;
    await createPageMessage(pageId!, conversationId, content);
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