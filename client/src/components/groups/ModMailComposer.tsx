import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { createModMailConversation } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

interface ModMailComposerProps {
  groupId: string;
  onConversationCreated: () => void;
}

export function ModMailComposer({ groupId, onConversationCreated }: ModMailComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createModMailConversation(groupId, {
        subject,
        recipientId: recipient,
        initialMessage: message
      });
      addToast('Modmail conversation created successfully', 'success');
      setIsOpen(false);
      setSubject('');
      setRecipient('');
      setMessage('');
      onConversationCreated();
    } catch (error) {
      addToast('Failed to create modmail conversation', 'error');
    }
  };

  if (!isOpen) {
    return (
      <Button 
        size="sm" 
        className="mx-4 mb-2" 
        onClick={() => setIsOpen(true)}
      >
        New Modmail
      </Button>
    );
  }

  return (
    <div className="mx-4 mb-4 p-4 border border-dark-200 dark:border-dark-700 rounded-lg">
      <h4 className="font-semibold mb-3">New Modmail Conversation</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>
        <div>
          <Input
            placeholder="Recipient user ID"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
          />
        </div>
        <div>
          <Textarea
            placeholder="Your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm">Send</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}