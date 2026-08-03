import { useEffect, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getChannels, createChannel } from '../../lib/api';
import { Hash, Megaphone, Plus, X } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  type?: 'group' | 'broadcast';
}

interface ChannelListProps {
  groupId: string;
  onSelectChannel: (channel: Channel) => void;
  selectedId?: string;
  canCreate?: boolean;
}

export const ChannelList = ({
  groupId,
  onSelectChannel,
  selectedId,
  canCreate = false,
}: ChannelListProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'group' | 'broadcast'>('group');
  const { addToast } = useToast();

  const refresh = async () => {
    try {
      const data = await getChannels(groupId);
      setChannels(data);
    } catch {
      addToast('Failed to load channels', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [groupId]);

  const handleCreate = async () => {
    const name = newChannelName.trim();
    if (!name) {
      addToast('Channel name is required', 'error');
      return;
    }
    try {
      const created = await createChannel(groupId, name, newChannelType);
      setChannels((prev) => [...prev, created]);
      setNewChannelName('');
      setIsCreating(false);
      onSelectChannel(created);
      addToast(
        newChannelType === 'broadcast'
          ? 'Broadcast channel created'
          : 'Channel created',
        'success',
      );
    } catch (error: any) {
      addToast(error?.response?.data?.message || 'Failed to create channel', 'error');
    }
  };

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const data = await getChannels(groupId);
        setChannels(data);
      } catch (error) {
        console.error('Failed to fetch channels', error);
        addToast('Failed to load channels', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, [groupId, addToast]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white border-r border-dark-200">
        <div className="p-lg border-b border-dark-200">
          <h2 className="text-lg font-bold text-dark-900">Channels</h2>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 p-md">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={40} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white border-r border-dark-200">
      <div className="p-lg border-b border-dark-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-dark-900">Channels</h2>
        {canCreate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating((v) => !v)}
            aria-label="Create channel"
          >
            {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        )}
      </div>
      {canCreate && isCreating && (
        <div className="p-md border-b border-dark-200 space-y-2">
          <Input
            placeholder="Channel name"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex items-center gap-2">
            <select
              className="flex-1 p-2 border rounded text-sm"
              value={newChannelType}
              onChange={(e) => setNewChannelType(e.target.value as 'group' | 'broadcast')}
            >
              <option value="group">Group</option>
              <option value="broadcast">Broadcast (admin-only posting)</option>
            </select>
            <Button size="sm" onClick={handleCreate}>Create</Button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {channels.length === 0 ? (
          <div className="p-lg text-center text-dark-500">No channels yet.</div>
        ) : (
          channels.map((channel) => (
            <div
              key={channel.id}
              className={`p-md cursor-pointer ${
                selectedId === channel.id ? 'bg-dark-100' : ''
              }`}
              onClick={() => onSelectChannel(channel)}
            >
              <div className="flex items-center gap-md">
                {channel.type === 'broadcast' ? (
                  <Megaphone className="w-5 h-5 text-orange-500 shrink-0" />
                ) : (
                  <Hash className="w-5 h-5 text-dark-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-dark-800 truncate">{channel.name}</div>
                  {channel.type === 'broadcast' && (
                    <div className="text-xs text-orange-600">Broadcast</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};