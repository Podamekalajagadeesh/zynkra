import { Hash, Volume2, Mic2, FileText } from 'lucide-react';
import { Community, CommunityChannel, CommunityChannelCategory } from '../../lib/types';
import { Button } from '../ui/button';

interface ServerChannelsListProps {
  community: Community;
  selectedChannelId: string | undefined;
  onSelectChannel: (id: string) => void;
  onJoinVoiceChannel: (channelId: string) => void;
  onJoinStageChannel: (channelId: string) => void;
}

const channelTypeIcons = {
  text: Hash,
  voice: Volume2,
  stage: Mic2,
  forum: FileText,
};

const channelTypeColors = {
  text: 'text-gray-500',
  voice: 'text-green-500',
  stage: 'text-blue-500',
  forum: 'text-purple-500',
};

export const ServerChannelsList = ({
  community,
  selectedChannelId,
  onSelectChannel,
  onJoinVoiceChannel,
  onJoinStageChannel,
}: ServerChannelsListProps) => {
  // Group channels by category
  const groupedChannels = community.categories.map((category) => ({
    ...category,
    channels: community.channels
      .filter((channel) => channel.categoryId === category.id)
      .sort((a, b) => a.position - b.position),
  })).sort((a, b) => a.position - b.position);

  // Get users in voice channels
  const getVoiceChannelUsers = (channelId: string) => {
    return community.activeVoiceChannels[channelId] || [];
  };

  // Get stage channel participants
  const getStageChannelParticipants = (channelId: string) => {
    return community.activeStageChannels[channelId] || [];
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-4 px-2">Server Channels</h3>
      
      {groupedChannels.map((category) => (
        <div key={category.id} className="space-y-1">
          <h4 className="text-xs font-semibold uppercase text-dark-500 dark:text-dark-400 px-2 mb-1">
            {category.name}
          </h4>
          
          {category.channels.map((channel) => {
            const Icon = channelTypeIcons[channel.type];
            const colorClass = channelTypeColors[channel.type];
            const isSelected = selectedChannelId === channel.id;
            const voiceUsers = getVoiceChannelUsers(channel.id);
            const stageParticipants = getStageChannelParticipants(channel.id);

            const handleChannelClick = () => {
              if (channel.type === 'voice') {
                onJoinVoiceChannel(channel.id);
              } else if (channel.type === 'stage') {
                onJoinStageChannel(channel.id);
              } else {
                onSelectChannel(channel.id);
              }
            };

            return (
              <button
                key={channel.id}
                onClick={handleChannelClick}
                className={`w-full flex items-center gap-2 p-2 rounded-md transition-colors text-left ${
                  isSelected
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100'
                    : 'hover:bg-dark-100 dark:hover:bg-dark-800'
                }`}
              >
                <Icon size={18} className={colorClass} />
                <span className="flex-1 truncate text-sm">{channel.name}</span>
                
                {/* Show user count for voice/stage channels */}
                {channel.type === 'voice' && voiceUsers.length > 0 && (
                  <span className="text-xs text-dark-500 dark:text-dark-400">
                    {voiceUsers.length}
                  </span>
                )}
                {channel.type === 'stage' && stageParticipants.length > 0 && (
                  <span className="text-xs text-dark-500 dark:text-dark-400">
                    {stageParticipants.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};