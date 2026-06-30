import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { UserProfile } from '../../lib/types';
import { getMyFollowers, searchUsers } from '../../lib/api';
import { X } from 'lucide-react';

interface TagFriendsModalProps {
  onClose: () => void;
  onTagUsers: (users: UserProfile[]) => void;
  taggedUsers: UserProfile[];
}

export function TagFriendsModal({ onClose, onTagUsers, taggedUsers }: TagFriendsModalProps) {
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>(taggedUsers);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const myFollowers = await getMyFollowers();
        setFollowers(myFollowers);
      } catch (error) {
        console.error('Failed to fetch followers:', error);
      }
    };
    fetchFollowers();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchText(query);
    if (query.length > 2) {
      try {
        const users = await searchUsers(query);
        setFollowers(users);
      } catch (error) {
        console.error('Failed to search users:', error);
      }
    } else {
      const myFollowers = await getMyFollowers();
      setFollowers(myFollowers);
    }
  };

  const toggleUserSelection = (user: UserProfile) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleDone = () => {
    onTagUsers(selectedUsers);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Tag People</h2>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={onClose} ariaLabel="Close tag friends modal">
            <X className="h-6 w-6" />
          </Button>
        </div>
        <Input
          type="text"
          placeholder="Search for people to tag"
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          className="mb-4"
        />
        <div className="space-y-2 h-64 overflow-y-auto">
          {followers.map(user => (
            <div
              key={user.id}
              className={`flex items-center p-2 rounded-md cursor-pointer ${selectedUsers.find(u => u.id === user.id) ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
              onClick={() => toggleUserSelection(user)}
            >
              <img src={user.pfp} alt={user.username} className="w-8 h-8 rounded-full mr-3" />
              <span>{user.username}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleDone}>Done</Button>
        </div>
      </div>
    </div>
  );
}