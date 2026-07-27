import { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '../../hooks/useToast';
import { Skeleton } from '../ui/skeleton';
import { getGroups } from '../../lib/api';
import { Hash, Lock } from 'lucide-react';
import { GroupPrivacy } from '../../types';

interface Group {
  id: string;
  name: string;
  privacy: GroupPrivacy;
}

interface GroupListProps {
  onSelectGroup: (id: string) => void;
  selectedId?: string;
}

export const GroupList = ({ onSelectGroup, selectedId }: GroupListProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await getGroups();
        setGroups(data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setGroups([]);
          return;
        }
        console.error('Failed to fetch groups', error);
        addToast('Failed to load groups', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [addToast]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white border-r border-dark-200">
        <div className="p-lg border-b border-dark-200">
          <h2 className="text-lg font-bold text-dark-900">Groups</h2>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 p-md">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={80} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white border-r border-dark-200">
      <div className="p-lg border-b border-dark-200">
        <h2 className="text-lg font-bold text-dark-900">Groups</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="p-lg text-center text-dark-500">No groups yet.</div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className={`p-md cursor-pointer ${
                selectedId === group.id ? 'bg-dark-100' : ''
              }`}
            >
              <div className="flex items-center gap-md">
                <div className="flex-1" onClick={() => onSelectGroup(group.id)}>
                  <div className="flex items-center gap-md">
                    <Hash className="w-6 h-6 text-dark-500" />
                    <div className="font-bold text-dark-900">{group.name}</div>
                    {group.privacy !== GroupPrivacy.PUBLIC && (
                      <Lock className="w-4 h-4 text-dark-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};