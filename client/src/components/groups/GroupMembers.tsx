import { useEffect, useState } from 'react';
import { getGroupMembers, updateMemberRole } from '../../lib/api';
import { useParams } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';

interface GroupMember {
  id: string;
  role: string;
  user: {
    id: string;
    email?: string;
    username?: string | null;
    displayName?: string | null;
    avatar?: string | null;
  };
}

const memberLabel = (user: GroupMember['user']) =>
  user.displayName || user.username || user.email || user.id;

interface GroupMembersProps {
  groupId?: string;
  canManageRoles?: boolean;
}

const GroupMembers = ({ groupId: groupIdProp, canManageRoles = false }: GroupMembersProps = {}) => {
  const { groupId: routeGroupId } = useParams<{ groupId: string }>();
  // Prefer the explicit prop: at /groups (no :id) the selected group is
  // component state, and route params alone would leave this panel empty.
  const groupId = groupIdProp ?? routeGroupId;
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!groupId) return;
    getGroupMembers(groupId)
      .then(setMembers)
      .catch((error: any) => {
        addToast(error?.response?.data?.message || 'Failed to load group members', 'error');
      });
  }, [groupId, addToast]);

  const handleRoleChange = async (userId: string, role: string) => {
    if (!groupId) return;
    setSavingUserId(userId);
    try {
      await updateMemberRole(groupId, userId, role);
      setMembers((prev) => prev.map((m) => (m.user.id === userId ? { ...m, role } : m)));
    } catch (error: any) {
      addToast(error?.response?.data?.message || 'Failed to update member role', 'error');
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Group Members</h2>
      <ul>
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between">
            <span>{memberLabel(member.user)}</span>
            {canManageRoles ? (
              <select
                value={member.role}
                disabled={savingUserId === member.user.id}
                onChange={(e) => handleRoleChange(member.user.id, e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="member">Member</option>
              </select>
            ) : (
              <span className="text-xs text-dark-500 capitalize">{member.role}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupMembers;
