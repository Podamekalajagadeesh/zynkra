import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/PageShell';
import { getPage, sendMessageToPage, updatePage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Post } from '../../lib/types';

interface Page {
  id: string;
  name: string;
  description: string;
  avatar: string;
  coverImage: string;
  ownerId: string;
  owner: {
    id: string;
    username: string;
  };
  posts: Post[];
  automatedResponseEnabled: boolean;
  automatedResponseMessage: string;
}

export function PageProfile() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const navigate = useNavigate();
  const [messageContent, setMessageContent] = useState('');
  const [isMessaging, setIsMessaging] = useState(false);
  const { user } = useAuth();

  const [automatedResponseEnabled, setAutomatedResponseEnabled] = useState(false);
  const [automatedResponseMessage, setAutomatedResponseMessage] = useState('');

  useEffect(() => {
    if (id) {
      getPage(id).then(page => {
        setPage(page);
        setAutomatedResponseEnabled(page.automatedResponseEnabled);
        setAutomatedResponseMessage(page.automatedResponseMessage);
      });
    }
  }, [id]);

  const handleSendMessage = async () => {
    if (!id || !messageContent.trim()) return;
    try {
      const message = await sendMessageToPage(id, messageContent);
      if (message.conversation?.id) {
        navigate(`/dms/${message.conversation.id}`);
      } else {
        setIsMessaging(false);
        setMessageContent('');
      }
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await updatePage(id, {
        automatedResponseEnabled,
        automatedResponseMessage,
      });
      alert('Settings saved!');
    } catch (error) {
      console.error('Failed to save settings', error);
    }
  };

  if (!page) {
    return <div>Loading...</div>;
  }

  const isOwner = user?.id === page.ownerId;

  return (
    <PageShell title={page.name}>
      <p>{page.description}</p>
      {!isMessaging && (
        <button onClick={() => setIsMessaging(true)}>Message</button>
      )}
      {isMessaging && (
        <div>
          <textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={`Message ${page.name}`}
          />
          <button onClick={handleSendMessage}>Send</button>
          <button onClick={() => setIsMessaging(false)}>Cancel</button>
        </div>
      )}

      {isOwner && (
        <form onSubmit={handleSettingsSubmit}>
          <h3>Automated Response Settings</h3>
          <div>
            <label>
              <input
                type="checkbox"
                checked={automatedResponseEnabled}
                onChange={(e) => setAutomatedResponseEnabled(e.target.checked)}
              />
              Enable Automated Response
            </label>
          </div>
          {automatedResponseEnabled && (
            <div>
              <textarea
                value={automatedResponseMessage}
                onChange={(e) => setAutomatedResponseMessage(e.target.value)}
                placeholder="Write your automated response here"
              />
            </div>
          )}
          <button type="submit">Save Settings</button>
        </form>
      )}

      {/* Render posts, members, etc. here */}
    </PageShell>
  );
}