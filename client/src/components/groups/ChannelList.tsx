import { useEffect, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { Skeleton } from '../ui/skeleton';
import { getChannels } from '../../lib/api';
import { Hash } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
}

interface ChannelListProps {
  groupId: string;
  onSelectChannel: (id: string) => void;
  selectedId?: string;
}

export const ChannelList = ({ groupId, onSelectChannel, selectedId }: ChannelListProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

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
      <div className="p-lg border-b border-dark-200">
        <h2 className="text-lg font-bold text-dark-900">Channels</h2>
      </div>
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
              onClick={() => onSelectChannel(channel.id)}
            >
              <div className="flex items-center gap-md">
                <Hash className="w-5 h-5 text-dark-500" />
                <div className="font-semibold text-dark-800">{channel.name}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};