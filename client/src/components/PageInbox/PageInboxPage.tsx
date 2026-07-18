import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageConversation } from '../../lib/types';
import { getPageConversations } from '../../lib/api';
import { PageShell } from '../PageShell';
import { PageConversationList } from './PageConversationList';
import { PageMessageList } from './PageMessageList';

export function PageInboxPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const [conversations, setConversations] = useState<PageConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<PageConversation | null>(null);

  useEffect(() => {
    if (pageId) {
      getPageConversations(pageId).then(setConversations);
    }
  }, [pageId]);

  return (
    <PageShell title="Page Inbox">
      <div className="flex h-full">
        <PageConversationList
          conversations={conversations}
          onSelectConversation={setSelectedConversation}
        />
        <div className="flex-1">
          {selectedConversation ? (
            <PageMessageList conversation={selectedConversation} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}