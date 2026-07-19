import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { startConversation } from '../../lib/api';

interface MatchCardProps {
  match: {
    id: string;
    createdAt: string;
    users: { id: string; displayName?: string | null; username?: string | null; email?: string | null }[];
  };
}

const MatchCard = ({ match }: MatchCardProps) => {
  const { activeAccount } = useAuth();
  const navigate = useNavigate();
  const otherUser = match.users.find((u) => u.id !== activeAccount?.user.id);

  if (!otherUser) return null;

  const name = otherUser.displayName || otherUser.username || otherUser.email || 'Anonymous';

  const handleMessage = async () => {
    try {
      const conversation = await startConversation(otherUser.id);
      navigate(`/dms/${conversation.id}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
      <div>
        <h3 className="font-semibold">{name}</h3>
        <p className="text-xs text-dark-500">
          Matched {new Date(match.createdAt).toLocaleDateString()}
        </p>
      </div>
      <button
        onClick={handleMessage}
        className="flex items-center gap-1 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
      >
        <MessageCircle size={16} />
        Message
      </button>
    </div>
  );
};

export default MatchCard;
