import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageShell } from '../../components/PageShell';
import { getPageConversations, getPage } from '../../lib/api';
import { Conversation } from '../../lib/types';

export function PageInbox() {
  const { id } = useParams<{ id: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pageName, setPageName] = useState('');

  useEffect(() => {
    if (id) {
      getPage(id).then(page => {
        setPageName(page.name);
      });
      getPageConversations(id).then(setConversations);
    }
  }, [id]);

  return (
    <PageShell title={`${pageName} - Inbox`}>
      <h2>Inbox</h2>
      <ul>
        {conversations.map((convo) => (
          <li key={convo.id}>
            <Link to={`/dms/${convo.id}`}>
              Conversation with {convo.participants.map(p => p.username).join(', ')}
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}