import { PageConversation } from '../../lib/types';

interface PageConversationListProps {
  conversations: PageConversation[];
  onSelectConversation: (conversation: PageConversation) => void;
}

export function PageConversationList({
  conversations,
  onSelectConversation,
}: PageConversationListProps) {
  return (
    <div className="w-1/4 border-r">
      <h2 className="p-4 text-lg font-bold">Conversations</h2>
      <ul>
        {conversations.map((conversation) => (
          <li
            key={conversation.id}
            className="cursor-pointer p-4 hover:bg-gray-100"
            onClick={() => onSelectConversation(conversation)}
          >
            {conversation.participants
              .map((p) => p.username)
              .join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}