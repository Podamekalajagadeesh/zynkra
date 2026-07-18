import { useState } from 'react';
import { createConversation } from '../../lib/api';
import { User } from '../../lib/types';

interface CreateGroupDmProps {
  users: User[];
  onGroupCreated: () => void;
}

export const CreateGroupDm = ({
  users,
  onGroupCreated,
}: CreateGroupDmProps) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  const handleUserSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createConversation(selectedUserIds, groupName, true);
    onGroupCreated();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-lg font-semibold mb-2">Create Group DM</h2>
      <input
        type="text"
        placeholder="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <div className="mb-2">
        <h3 className="font-semibold">Select Users</h3>
        {users.map((user) => (
          <div key={user.id}>
            <input
              type="checkbox"
              checked={selectedUserIds.includes(user.id)}
              onChange={() => handleUserSelect(user.id)}
            />
            <span className="ml-2">{user.email}</span>
          </div>
        ))}
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white p-2 rounded"
        disabled={selectedUserIds.length === 0}
      >
        Create Group
      </button>
    </form>
  );
};