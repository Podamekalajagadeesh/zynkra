import { Community } from '../../lib/types';
import { Avatar } from '../Avatar';

interface CommunityListProps {
  communities: Community[];
  onSelectCommunity: (id: string) => void;
  selectedId?: string;
}

export const CommunityList = ({ communities, onSelectCommunity, selectedId }: CommunityListProps) => {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg mb-4">Your Communities</h3>
      {communities.map((community) => (
        <button
          key={community.id}
          onClick={() => onSelectCommunity(community.id)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
            selectedId === community.id
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100'
              : 'hover:bg-dark-100 dark:hover:bg-dark-800'
          }`}
        >
          {community.iconUrl ? (
            <img
              src={community.iconUrl}
              alt={community.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
              {community.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">r/{community.name}</p>
            <p className="text-xs text-dark-500 dark:text-dark-400">
              {community.memberCount.toLocaleString()} members
            </p>
          </div>
        </button>
      ))}
      {communities.length === 0 && (
        <div className="text-center py-8 text-dark-500 dark:text-dark-400">
          <p>No communities yet</p>
          <p className="text-sm">Create one to get started!</p>
        </div>
      )}
    </div>
  );
};