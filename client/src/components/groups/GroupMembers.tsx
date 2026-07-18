import { useEffect, useState } from 'react';
import { getGroupMembers, updateMemberRole } from '../../lib/api';
import { useParams } from 'react-router-dom';

interface GroupMember {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
  };
}

const GroupMembers = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [members, setMembers] = useState<GroupMember[]>([]);

  useEffect(() => {
    if (groupId) {
      getGroupMembers(groupId).then(setMembers);
    }
  }, [groupId]);

  const handleRoleChange = (userId: string, role: string) => {
    if (groupId) {
      updateMemberRole(groupId, userId, role).then(() => {
        getGroupMembers(groupId).then(setMembers);
      });
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Group Members</h2>
      <ul>
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between">
            <span>{member.user.email}</span>
            <select
              value={member.role}
              onChange={(e) => handleRoleChange(member.user.id, e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="member">Member</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupMembers;