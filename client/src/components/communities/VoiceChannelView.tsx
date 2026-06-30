import { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, Settings, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar } from '../Avatar';

interface VoiceChannelViewProps {
  channelName: string;
  participants: string[];
  onLeave: () => void;
}

export const VoiceChannelView = ({
  channelName,
  participants,
  onLeave,
}: VoiceChannelViewProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  return (
    <div className="flex flex-col h-full bg-dark-50 dark:bg-dark-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-dark-200 dark:border-dark-800">
        <h3 className="font-semibold text-lg">#{channelName}</h3>
        <p className="text-sm text-dark-500 dark:text-dark-400">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Main content - video grid */}
      <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto">
        {/* Local user video */}
        <div className="aspect-video bg-dark-200 dark:bg-dark-800 rounded-lg flex items-center justify-center relative">
          <Avatar className="w-16 h-16" />
          <span className="absolute bottom-2 left-2 text-sm">You</span>
          {isMuted && <MicOff className="absolute top-2 right-2 text-red-500" size={20} />}
        </div>
        
        {/* Other participants */}
        {participants.slice(0, 5).map((userId, index) => (
          <div key={userId} className="aspect-video bg-dark-200 dark:bg-dark-800 rounded-lg flex items-center justify-center relative">
            <Avatar className="w-16 h-16" />
            <span className="absolute bottom-2 left-2 text-sm">User {index + 1}</span>
          </div>
        ))}
      </div>

      {/* Participants sidebar */}
      {showParticipants && (
        <div className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-dark-950 border-l border-dark-200 dark:border-dark-800 p-4">
          <h4 className="font-semibold mb-4">Participants ({participants.length + 1})</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8" />
              <span className="text-sm">You</span>
            </div>
            {participants.map((userId, index) => (
              <div key={userId} className="flex items-center gap-2">
                <Avatar className="w-8 h-8" />
                <span className="text-sm">User {index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="p-4 border-t border-dark-200 dark:border-dark-800 bg-dark-100 dark:bg-dark-950">
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className={isMuted ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : ''}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            className={!isVideoEnabled ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : ''}
          >
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users size={20} />
          </Button>
          
          <Button variant="ghost" size="icon">
            <Settings size={20} />
          </Button>
          
          <Button
            variant="destructive"
            size="icon"
            onClick={onLeave}
            className="bg-red-500 hover:bg-red-600"
          >
            <Phone size={20} className="transform rotate-135" />
          </Button>
        </div>
      </div>
    </div>
  );
};