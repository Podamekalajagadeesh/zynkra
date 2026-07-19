import { Conversation } from '../dms/ConversationList';
import { getModMailConversations } from '../../lib/api';
import { useEffect, useState } from 'react';
import { Shield, Mail } from 'lucide-react';

/** Modmail thread as returned by the server (subject stored in `name`). */
type ModMailThread = Conversation & { name?: string };

interface ModMailConversationListProps {
  groupId: string;
  onSelectConversation: (conversation: Conversation) => void;
  selectedId?: string;
}

export function ModMailConversationList({ 
  groupId, 
  onSelectConversation, 
  selectedId 
}: ModMailConversationListProps) {
  const [conversations, setConversations] = useState<ModMailThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      getModMailConversations(groupId).then(data => {
        setConversations(data);
        setLoading(false);
      });
    }
  }, [groupId]);

  if (loading) {
    return <div className="p-4">Loading modmail...</div>;
  }

  return (
    <div className="border-t border-dark-200 dark:border-dark-700 mt-4 pt-4">
      <div className="flex items-center gap-2 px-4 mb-2">
        <Shield className="h-4 w-4" />
        <h3 className="font-semibold">Mod Mail</h3>
        <span className="text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 px-2 py-0.5 rounded-full">
          {conversations.length}
        </span>
      </div>
      <ul>
        {conversations.length === 0 ? (
          <li className="px-4 py-2 text-sm text-gray-500">No modmail conversations</li>
        ) : (
          conversations.map(conversation => (
            <li
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`px-4 py-2 cursor-pointer flex items-center gap-2 ${
                selectedId === conversation.id 
                  ? 'bg-primary-100 dark:bg-primary-900' 
                  : 'hover:bg-dark-100 dark:hover:bg-dark-800'
              }`}
            >
              <Mail className="h-4 w-4" />
              <span className="truncate">{conversation.name || 'New conversation'}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}