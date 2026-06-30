import { useState } from 'react';
import { Mic, MicOff, Hand, Users, Settings, Phone, Volume2, Mic2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar } from '../Avatar';
import { StageParticipant } from '../../lib/types';

interface StageChannelViewProps {
  channelName: string;
  participants: StageParticipant[];
  onLeave: () => void;
}

export const StageChannelView = ({
  channelName,
  participants,
  onLeave,
}: StageChannelViewProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  // Separate speakers from audience
  const speakers = participants.filter(p => p.isSpeaker);
  const audience = participants.filter(p => !p.isSpeaker);

  const handleRaiseHand = () => {
    setHasRaisedHand(!hasRaisedHand);
    // In a real app, this would emit to the server to request speaker permissions
  };

  const handleRequestToSpeak = () => {
    // In a real app, this would send a request to the stage host
    setIsSpeaker(true);
    setHasRaisedHand(false);
  };

  return (
    <div className="flex flex-col h-full bg-dark-50 dark:bg-dark-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-dark-200 dark:border-dark-800">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Mic2 size={20} className="text-blue-500" />
          {channelName}
        </h3>
        <p className="text-sm text-dark-500 dark:text-dark-400">
          {speakers.length} speakers, {audience.length} listening
        </p>
      </div>

      {/* Main content - stage speakers */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h4 className="text-sm font-semibold mb-3 text-dark-600 dark:text-dark-400">Stage</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {speakers.map((participant, index) => (
            <div key={participant.userId} className="aspect-square bg-dark-200 dark:bg-dark-800 rounded-lg flex flex-col items-center justify-center relative">
              <Avatar className="w-20 h-20 mb-2" />
              <span className="text-sm">Speaker {index + 1}</span>
              {participant.isMuted && <MicOff className="absolute top-2 right-2 text-red-500" size={18} />}
            </div>
          ))}
          
          {/* If user is a speaker, add their video */}
          {isSpeaker && (
            <div className="aspect-square bg-dark-200 dark:bg-dark-800 rounded-lg flex flex-col items-center justify-center relative">
              <Avatar className="w-20 h-20 mb-2" />
              <span className="text-sm">You</span>
              {isMuted && <MicOff className="absolute top-2 right-2 text-red-500" size={18} />}
            </div>
          )}
        </div>

        {/* Audience grid */}
        <h4 className="text-sm font-semibold mb-3 text-dark-600 dark:text-dark-400">
          Audience ({audience.length + (isSpeaker ? 0 : 1)})
        </h4>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {!isSpeaker && (
            <div className="aspect-square bg-dark-200 dark:bg-dark-800 rounded-lg flex items-center justify-center">
              <Avatar className="w-10 h-10" />
            </div>
          )}
          {audience.slice(0, 15).map((participant, index) => (
            <div key={participant.userId} className="aspect-square bg-dark-200 dark:bg-dark-800 rounded-lg flex items-center justify-center">
              <Avatar className="w-10 h-10" />
            </div>
          ))}
        </div>
      </div>

      {/* Participants sidebar */}
      {showParticipants && (
        <div className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-dark-950 border-l border-dark-200 dark:border-dark-800 p-4 overflow-y-auto">
          <h4 className="font-semibold mb-4">All Participants ({participants.length + 1})</h4>
          
          <div className="mb-4">
            <h5 className="text-xs font-semibold uppercase text-dark-500 mb-2">Speakers</h5>
            <div className="space-y-2">
              {isSpeaker && (
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8" />
                  <span className="text-sm">You {isMuted && '(muted)'}</span>
                </div>
              )}
              {speakers.map((p, i) => (
                <div key={p.userId} className="flex items-center gap-2">
                  <Avatar className="w-8 h-8" />
                  <span className="text-sm">Speaker {i + 1} {p.isMuted && '(muted)'}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase text-dark-500 mb-2">Audience</h5>
            <div className="space-y-2">
              {!isSpeaker && (
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8" />
                  <span className="text-sm">You {hasRaisedHand && '(hand raised)'}</span>
                </div>
              )}
              {audience.map((p, i) => (
                <div key={p.userId} className="flex items-center gap-2">
                  <Avatar className="w-8 h-8" />
                  <span className="text-sm">Listener {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="p-4 border-t border-dark-200 dark:border-dark-800 bg-dark-100 dark:bg-dark-950">
        <div className="flex items-center justify-center gap-3">
          {isSpeaker ? (
            // Speaker controls
            <>
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
                onClick={() => setIsSpeaker(false)}
              >
                <Volume2 size={20} />
              </Button>
            </>
          ) : (
            // Audience controls - raise hand to speak
            <Button
              variant="ghost"
              onClick={handleRaiseHand}
              className={hasRaisedHand ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500' : ''}
            >
              <Hand size={20} className="mr-2" />
              {hasRaisedHand ? 'Hand Raised' : 'Raise Hand'}
            </Button>
          )}
          
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