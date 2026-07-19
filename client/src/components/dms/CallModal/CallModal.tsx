import { X, Mic, MicOff, Video, VideoOff, Monitor, Square, Film, Sparkles } from 'lucide-react';
import { Button } from '../../ui/button';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleBackgroundBlur: () => void;
  onStartScreenShare: () => Promise<boolean>;
  onStopScreenShare: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isBackgroundBlurEnabled: boolean;
  participants: string[];
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

export function CallModal({
  isOpen,
  onClose,
  onToggleMute,
  onToggleVideo,
  onToggleBackgroundBlur,
  onStartScreenShare,
  onStopScreenShare,
  onStartRecording,
  onStopRecording,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  isRecording,
  isBackgroundBlurEnabled,
  participants,
  localVideoRef,
  remoteVideoRef,
}: CallModalProps) {
  if (!isOpen) return null;

  // Dynamic grid layout based on number of participants (supports large group calls)
  const getGridCols = () => {
    const totalParticipants = participants.length + 1; // +1 for local user
    if (totalParticipants <= 2) return 'grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-2';
    if (totalParticipants <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const handleScreenShareToggle = async () => {
    if (isScreenSharing) {
      onStopScreenShare();
    } else {
      const success = await onStartScreenShare();
      if (!success) {
        // Could show error toast here
      }
    }
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 overflow-auto py-8">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-6xl relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {participants.length > 0 ? `Group Call (${participants.length + 1} participants)` : 'Voice/Video Call'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={onClose}
          >
            <X size={24} />
          </Button>
        </div>
        
        {/* Video grid - dynamically sized based on number of participants */}
        <div className={`grid ${getGridCols()} gap-4 mb-6`}>
          {/* Local video */}
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
              You {isBackgroundBlurEnabled && '(blur enabled)'}
            </div>
          </div>
          
          {/* Remote video for 1:1 calls */}
          {participants.length === 0 && (
            <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                Remote user
              </div>
            </div>
          )}
          
          {/* Additional participants for group calls */}
          {participants.map((participantId, index) => (
            <div key={participantId} className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <video 
                ref={(el) => {
                  // This would be populated by LiveKit to handle all remote participants
                  if (el) {
                    // In a full implementation, we'd assign each remote video element to its participant's stream
                  }
                }}
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                {participantId.slice(0, 8)}
              </div>
            </div>
          ))}
        </div>

        {/* Call controls */}
        <div className="flex flex-wrap justify-center gap-3">
          {/* Mute toggle */}
          <Button 
            onClick={onToggleMute} 
            variant={isMuted ? 'destructive' : 'secondary'}
            className="flex items-center gap-2"
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
          
          {/* Video toggle */}
          <Button 
            onClick={onToggleVideo} 
            variant={isVideoEnabled ? 'secondary' : 'destructive'}
            className="flex items-center gap-2"
          >
            {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
            {isVideoEnabled ? 'Stop Video' : 'Start Video'}
          </Button>
          
          {/* Background blur toggle */}
          <Button 
            onClick={onToggleBackgroundBlur} 
            variant={isBackgroundBlurEnabled ? 'primary' : 'secondary'}
            className="flex items-center gap-2"
          >
            <Sparkles size={18} />
            {isBackgroundBlurEnabled ? 'Disable Blur' : 'Enable Blur'}
          </Button>
          
          {/* Screen share toggle */}
          <Button 
            onClick={handleScreenShareToggle} 
            variant={isScreenSharing ? 'destructive' : 'secondary'}
            className="flex items-center gap-2"
          >
            <Monitor size={18} />
            {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          </Button>
          
          {/* Recording toggle */}
          <Button 
            onClick={handleRecordingToggle} 
            variant={isRecording ? 'destructive' : 'secondary'}
            className="flex items-center gap-2"
          >
            <Square size={18} className={isRecording ? 'fill-white' : ''} />
            {isRecording ? 'Stop Recording' : 'Record Call'}
          </Button>
          
          {/* End call */}
          <Button onClick={onClose} variant="destructive" className="flex items-center gap-2">
            <X size={18} />
            End Call
          </Button>
        </div>
      </div>
    </div>
  );
}