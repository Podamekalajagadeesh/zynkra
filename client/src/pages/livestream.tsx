import { useState, useEffect, useRef } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { DollarSign, Users, Monitor, Settings, X } from 'lucide-react';
import { sendTip, createReplay } from '../lib/api';
import { useAccount, useBalance } from 'wagmi';
import { parseEther } from 'viem';
import LiveStreamChat from '../components/LiveStreamChat';
import SpatialAudioControls from '../components/SpatialAudioControls';
import { Room, LocalVideoTrack, RoomEvent, Track } from 'livekit-client';
import { io } from 'socket.io-client';
import { spatialAudioService } from '../services/spatialAudio';

// LiveKit socket connection to our backend
const socket = io('http://localhost:3001');

export const LiveStreamPage = () => {
  const [isTipping, setIsTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState('0.01');
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const [isStreaming, setIsStreaming] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [guestId, setGuestId] = useState('');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [showOverlaySettings, setShowOverlaySettings] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const userVideo = useRef<HTMLVideoElement>(null);
  const guestVideos = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);

  useEffect(() => {
    // Listen for LiveKit token from backend
    socket.on('stream-token', async ({ token, roomName }) => {
      setLivekitToken(token);
      await connectToLiveKit(token, roomName);
    });

    // Listen for stream invites as guest
    socket.on('stream-invite', async ({ roomName, hostId }) => {
      const accepted = window.confirm(`You have been invited to join the stream as a guest. Accept?`);
      if (accepted && currentUser?.id) {
        // Join as guest (can publish)
        socket.emit('join-stream', { 
          roomName, 
          userId: currentUser.id, 
          isHost: false 
        });
      }
    });

    // Listen for participants joining/leaving
    socket.on('participant-joined', ({ userId }) => {
      setParticipants(prev => [...prev, userId]);
    });

    socket.on('participant-left', ({ userId }) => {
      setParticipants(prev => prev.filter(id => id !== userId));
    });

    return () => {
      socket.off('stream-token');
      socket.off('stream-invite');
      socket.off('participant-joined');
      socket.off('participant-left');
      if (room) {
        room.disconnect();
      }
      // Cleanup spatial audio service
      spatialAudioService.dispose();
    };
  }, [room, currentUser]);

  const connectToLiveKit = async (token: string, roomName: string) => {
    try {
      const newRoom = new Room();
      await newRoom.connect(process.env.LIVEKIT_URL || 'wss://your-livekit-instance.com', token);
      setRoom(newRoom);

      // Initialize spatial audio service with the LiveKit room
      await spatialAudioService.initialize(newRoom, {
        maxDistance: 100,
        rolloffFactor: 1.5,
      });

      // Handle remote participants (guests)
      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        participant.trackPublications.forEach((publication) => {
          const el = guestVideos.current[participant.identity];
          if (publication.track && el) {
            publication.track.attach(el);
          }
        });
      });

      addToast('Successfully connected to LiveKit stream with spatial audio!', 'success');
    } catch (error) {
      console.error('Failed to connect to LiveKit:', error);
      addToast('Failed to join stream', 'error');
    }
  };

  const handleStartStream = async () => {
    if (!currentUser?.id) {
      addToast('You must be logged in to stream', 'error');
      return;
    }

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      // Display local video
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      // Request LiveKit token from backend (host = can publish)
      socket.emit('join-stream', {
        roomName: 'zynkra-main-stream',
        userId: currentUser.id,
        isHost: true
      });

      // Start recording
      startRecording(stream);
      setIsStreaming(true);
    } catch (error) {
      console.error('Failed to start stream:', error);
      addToast('Failed to start stream', 'error');
    }
  };

  const handleInviteGuest = () => {
    if (!guestId || !currentUser?.id) return;
    
    // Send invite to guest through backend
    socket.emit('invite-guest', {
      roomName: 'zynkra-main-stream',
      guestId: guestId,
      hostId: currentUser.id
    });
    
    addToast(`Invitation sent to ${guestId}`, 'success');
    setGuestId('');
  };

  const handleStopStream = async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
    }
    setIsStreaming(false);
    setParticipants([]);
    stopRecording();
    socket.emit('leave-stream', { roomName: 'zynkra-main-stream', userId: currentUser?.id });
  };

  const startRecording = (stream: MediaStream) => {
    const recorder = new MediaRecorder(stream);
    mediaRecorder.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const handleStartScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      screenStreamRef.current = screenStream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
      }

      // Add screen share track to LiveKit room
      if (room) {
        const track = new LocalVideoTrack(screenStream.getVideoTracks()[0]);
        await room.localParticipant.publishTrack(track);
      }

      setIsScreenSharing(true);
      addToast('Screen sharing started', 'success');
    } catch (error) {
      console.error('Failed to start screen share:', error);
      addToast('Failed to start screen sharing', 'error');
    }
  };

  const handleStopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }

    // Unpublish screen share track from LiveKit room
    if (room) {
      room.localParticipant.trackPublications.forEach((publication) => {
        const track = publication.track;
        if (track && track.source === Track.Source.ScreenShare) {
          room.localParticipant.unpublishTrack(track);
        }
      });
    }

    setIsScreenSharing(false);
    addToast('Screen sharing stopped', 'success');
  };

  const handleAddOverlay = () => {
    if (!overlayText.trim()) {
      addToast('Please enter overlay text', 'warning');
      return;
    }
    setShowOverlay(true);
    setShowOverlaySettings(false);
    addToast('Overlay added to stream', 'success');
  };

  const handleSaveReplay = async () => {
    if (recordedChunks.length === 0) {
      addToast('No recording available to save.', 'warning');
      return;
    }

    const title = prompt('Enter a title for your replay:');
    if (!title) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoUrl = URL.createObjectURL(blob);

    try {
      await createReplay({ title, videoUrl });
      addToast('Replay saved successfully!', 'success');
      setRecordedChunks([]);
    } catch (error) {
      console.error('Failed to save replay:', error);
      addToast('Failed to save replay.', 'error');
    }
  };

  const handleTip = async () => {
    if (!address) {
      addToast('Please connect your wallet to send a tip', 'warning');
      return;
    }
    if (!currentUser?.walletAddress) {
      addToast('This user has not connected a wallet and cannot receive tips', 'error');
      return;
    }
    if (parseFloat(tipAmount) <= 0) {
      addToast('Please enter a valid tip amount', 'warning');
      return;
    }
    if (!window.ethereum) {
      addToast('No wallet provider found', 'error');
      return;
    }

    try {
      const tx = (await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: currentUser.walletAddress,
          value: parseEther(tipAmount).toString(),
        }],
      })) as string;

      await sendTip({
        fromAddress: address,
        toAddress: currentUser.walletAddress,
        amount: parseFloat(tipAmount),
        txHash: tx,
        postId: 'livestream',
      });

      addToast(`Successfully sent a ${tipAmount} ETH tip!`, 'success');
      setIsTipping(false);
    } catch (error) {
      console.error('Failed to send tip:', error);
      addToast('Failed to send tip', 'error');
    }
  };

  return (
    <PageShell title="Live Stream">
      <div className="flex flex-col items-center justify-center h-full">
        {isStreaming ? (
          <>
            <div className="w-full max-w-4xl">
              <video ref={userVideo} autoPlay muted playsInline className="w-full rounded-lg" />
            </div>
            <p className="my-4 text-lg font-medium">You are live! {participants.length} guest(s) connected</p>
            
            {/* Guest videos grid - supports up to 10 guests */}
            {participants.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 w-full max-w-6xl">
                {participants.map((guestId) => (
                  <div key={guestId} className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      ref={(el) => (guestVideos.current[guestId] = el)}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <p className="text-xs text-center text-white mt-1">{guestId.slice(0, 8)}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-4 mt-6">
              <Button onClick={handleStopStream} variant="destructive">
                Stop Stream
              </Button>
              {!isScreenSharing ? (
                <Button onClick={handleStartScreenShare} variant="secondary">
                  <Monitor size={18} className="mr-2" />
                  Start Screen Share
                </Button>
              ) : (
                <Button onClick={handleStopScreenShare} variant="destructive">
                  <Monitor size={18} className="mr-2" />
                  Stop Screen Share
                </Button>
              )}
              <Button onClick={() => setShowOverlaySettings(!showOverlaySettings)} variant="secondary">
                <Settings size={18} className="mr-2" />
                {showOverlay ? 'Edit Overlay' : 'Add Overlay'}
              </Button>
              <Button onClick={() => setIsTipping(!isTipping)} variant="primary">
                <DollarSign size={18} className="mr-2" />
                Send Tip
              </Button>
            </div>

            {/* Screen sharing preview */}
            {isScreenSharing && (
              <div className="w-full max-w-4xl mt-4">
                <h3 className="text-lg font-medium mb-2">Screen Share Preview</h3>
                <video ref={screenVideoRef} autoPlay muted playsInline className="w-full rounded-lg" />
              </div>
            )}

            {/* Overlay settings modal */}
            {showOverlaySettings && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Add Stream Overlay</h3>
                    <button onClick={() => setShowOverlaySettings(false)} className="p-1">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Overlay Text</label>
                      <Input
                        type="text"
                        placeholder="Enter text to display on stream"
                        value={overlayText}
                        onChange={(e) => setOverlayText(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddOverlay} variant="primary" className="flex-1">
                        Add to Stream
                      </Button>
                      <Button onClick={() => setShowOverlaySettings(false)} variant="secondary" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active overlay */}
            {showOverlay && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg z-10">
                <p className="text-lg font-medium">{overlayText}</p>
              </div>
            )}

            {/* Invite guest UI */}
            <div className="mt-6 flex items-center gap-2">
              <Users size={18} className="text-gray-500" />
              <input
                type="text"
                placeholder="Enter guest user ID to invite"
                value={guestId}
                onChange={(e) => setGuestId(e.target.value)}
                className="px-3 py-2 border rounded-lg w-64"
              />
              <Button onClick={handleInviteGuest} variant="secondary" disabled={participants.length >= 9}>
                Invite Guest {participants.length >= 9 ? '(Full)' : `(${participants.length}/9)`}
              </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mt-8">
              <div className="w-full lg:w-80">
                <SpatialAudioControls 
                  roomName="zynkra-main-stream" 
                  isHost={currentUser?.id === participants[0]} 
                />
              </div>
              <div className="flex-1">
                <LiveStreamChat streamId="zynkra-main-stream" userId={currentUser?.id ?? ''} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <Button onClick={handleStartStream} variant="primary" size="lg">
              Start Live Stream
            </Button>
            {recordedChunks.length > 0 && (
              <Button onClick={handleSaveReplay} variant="secondary" className="mt-4">
                Save Replay
              </Button>
            )}
            <p className="mt-4 text-sm text-gray-500">Supports up to 10 co-streaming guests</p>
          </div>
        )}

        {isTipping && (
          <div className="mt-6 p-4 rounded-2xl border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/25 w-full max-w-md">
            <h4 className="mb-3 font-semibold text-green-900 dark:text-green-200">Send a Tip</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="flex-1 px-3 py-2 rounded-xl border border-green-200 bg-white dark:border-green-900/60 dark:bg-dark-900"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
              />
              <span className="font-semibold text-green-900 dark:text-green-200">ETH</span>
            </div>
            <p className="text-xs text-dark-500 mt-2">Your balance: {balance?.formatted} {balance?.symbol}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="primary" size="sm" onClick={handleTip}>Send Tip</Button>
              <Button variant="secondary" size="sm" onClick={() => setIsTipping(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};