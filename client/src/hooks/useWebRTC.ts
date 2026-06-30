import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { API_BASE_URL } from '../../lib/api';
import { LiveKitService } from '../services/livekit'; // Our new LiveKit integration

// Enhanced ICE servers for better connectivity
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add TURN server for production to support all network conditions
    ...(process.env.TURN_SERVER_URL ? [{
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_SERVER_USERNAME,
      credential: process.env.TURN_SERVER_CREDENTIAL
    }] : []),
  ],
};

export function useWebRTC(conversationId: string | undefined) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isBackgroundBlurEnabled, setIsBackgroundBlurEnabled] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<SocketIOClient.Socket | null>(null);
  const liveKitRoomRef = useRef<any>(null); // For group calls using LiveKit
  const blurCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const blurStreamRef = useRef<MediaStream | null>(null);

  // Handle ICE candidates for P2P calls
  const handleIceCandidate = useCallback((event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      socketRef.current?.emit('ice-candidate', {
        candidate: event.candidate,
        room: conversationId,
      });
    }
  }, [conversationId]);

  // Handle incoming tracks for P2P calls
  const handleTrack = useCallback((event: RTCTrackEvent) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = event.streams[0];
    }
  }, []);

  // Create peer connection for 1:1 calls
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = handleIceCandidate;
    pc.ontrack = handleTrack;
    return pc;
  }, [handleIceCandidate, handleTrack]);

  // Apply background blur to video stream
  const applyBackgroundBlur = useCallback(async (stream: MediaStream): Promise<MediaStream> => {
    if (!isBackgroundBlurEnabled) return stream;
    
    try {
      // Create canvas for processing
      if (!blurCanvasRef.current) {
        blurCanvasRef.current = document.createElement('canvas');
      }
      const canvas = blurCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const videoTrack = stream.getVideoTracks()[0];
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      canvas.width = videoTrack.getSettings().width || 1280;
      canvas.height = videoTrack.getSettings().height || 720;
      
      // Simple background blur implementation (can be enhanced with TensorFlow.js for person segmentation)
      const processFrame = () => {
        if (!ctx || !isBackgroundBlurEnabled) return;
        ctx.filter = 'blur(15px)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(processFrame);
      };
      processFrame();
      
      const blurredStream = canvas.captureStream(30);
      // Combine with original audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) blurredStream.addTrack(audioTrack);
      
      blurStreamRef.current = blurredStream;
      return blurredStream;
    } catch (error) {
      console.error('Failed to apply background blur:', error);
      return stream;
    }
  }, [isBackgroundBlurEnabled]);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      screenStreamRef.current = screenStream;
      
      // Add screen share track to peer connection for P2P calls
      if (peerConnectionRef.current && localStreamRef.current) {
        screenStream.getTracks().forEach(track => {
          peerConnectionRef.current?.addTrack(track, screenStream);
        });
      }
      
      // For LiveKit group calls
      if (liveKitRoomRef.current) {
        const { LocalVideoTrack, VideoPresets } = await import('livekit-client');
        const track = await LocalVideoTrack.createStreamTrack(
          screenStream.getVideoTracks()[0], 
          VideoPresets.hd1080
        );
        await liveKitRoomRef.current.localParticipant.publishTrack(track);
      }
      
      setIsScreenSharing(true);
      return true;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      return false;
    }
  }, []);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    if (liveKitRoomRef.current) {
      liveKitRoomRef.current.localParticipant.tracks.forEach((publication: any) => {
        if (publication.track?.source === 'screen_share') {
          liveKitRoomRef.current.localParticipant.unpublishTrack(publication.track);
        }
      });
    }
    
    setIsScreenSharing(false);
  }, []);

  // Start call recording
  const startCallRecording = useCallback(() => {
    if (!localStreamRef.current) return;
    
    const combinedStream = new MediaStream([
      ...localStreamRef.current.getTracks(),
      ...(screenStreamRef.current?.getTracks() || []),
    ]);
    
    const recorder = new MediaRecorder(combinedStream);
    mediaRecorderRef.current = recorder;
    recordedChunksRef.current = [];
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    
    recorder.start();
    setIsRecording(true);
  }, []);

  // Stop call recording and save
  const stopCallRecording = useCallback(async () => {
    if (mediaRecorderRef.current && recordedChunksRef.current.length > 0) {
      mediaRecorderRef.current.stop();
      
      // Save recording blob - can be uploaded to server
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-recording-${new Date().toISOString()}.webm`;
      a.click();
      
      recordedChunksRef.current = [];
    }
    
    setIsRecording(false);
  }, []);

  // Toggle background blur
  const toggleBackgroundBlur = useCallback(() => {
    setIsBackgroundBlurEnabled(!isBackgroundBlurEnabled);
    // Reapply blur if enabling, or remove if disabling
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);
        
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(async (newStream) => {
            const processedStream = await applyBackgroundBlur(newStream);
            localStreamRef.current = processedStream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = processedStream;
            }
            // Update peer connection with new stream
            if (peerConnectionRef.current) {
              processedStream.getTracks().forEach(track => {
                peerConnectionRef.current?.addTrack(track, processedStream);
              });
            }
          });
      }
    }
  }, [isBackgroundBlurEnabled, applyBackgroundBlur]);

  // Initialize group call with LiveKit (supports large groups)
  const initializeGroupCall = useCallback(async (maxParticipants: number = 50) => {
    if (!conversationId) return;
    
    try {
      const { createRoom } = await import('livekit-client');
      const room = await createRoom();
      liveKitRoomRef.current = room;
      
      // Connect to LiveKit server with token from our backend
      const socket = io(API_BASE_URL);
      socket.emit('join-stream', { 
        roomName: conversationId, 
        userId: 'current-user-id', // Get from auth context
        isHost: true 
      });
      
      socket.on('stream-token', async ({ token }) => {
        await room.connect(process.env.LIVEKIT_URL || 'wss://your-livekit-instance.com', token);
        setIsCallActive(true);
      });
      
      // Handle participants joining/leaving
      room.on('participant-connected', (participant: any) => {
        setParticipants(prev => [...prev, participant.identity]);
      });
      
      room.on('participant-disconnected', (participant: any) => {
        setParticipants(prev => prev.filter(id => id !== participant.identity));
      });
      
    } catch (error) {
      console.error('Failed to initialize group call:', error);
    }
  }, [conversationId]);

  // Start call (supports both 1:1 and group calls)
  const startCall = useCallback(async (isGroupCall: boolean = false, maxParticipants: number = 50) => {
    if (isGroupCall) {
      await initializeGroupCall(maxParticipants);
      return;
    }
    
    // Original 1:1 call implementation with enhanced features
    setIsCallActive(true);
    peerConnectionRef.current = createPeerConnection();

    let stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    
    // Apply background blur if enabled
    stream = await applyBackgroundBlur(stream);
    localStreamRef.current = stream;
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => {
      peerConnectionRef.current?.addTrack(track, stream);
    });

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);

    socketRef.current?.emit('offer', { sdp: offer, room: conversationId });
  }, [createPeerConnection, conversationId, initializeGroupCall, applyBackgroundBlur]);

  const handleOffer = useCallback(async (data: { sdp: any; from: string }) => {
    if (!peerConnectionRef.current) {
      peerConnectionRef.current = createPeerConnection();
    }

    await peerConnectionRef.current.setRemoteDescription(
      new RTCSessionDescription(data.sdp)
    );

    let stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    
    // Apply background blur if enabled
    stream = await applyBackgroundBlur(stream);
    localStreamRef.current = stream;
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => {
      peerConnectionRef.current?.addTrack(track, stream);
    });

    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    socketRef.current?.emit('answer', { sdp: answer, room: conversationId });
    setIsCallActive(true);
  }, [createPeerConnection, conversationId, applyBackgroundBlur]);

  const handleAnswer = useCallback(async (data: { sdp: any; from: string }) => {
    await peerConnectionRef.current?.setRemoteDescription(
      new RTCSessionDescription(data.sdp)
    );
  }, []);

  const handleNewIceCandidate = useCallback(async (data: { candidate: any; from: string }) => {
    if (data.candidate) {
      await peerConnectionRef.current?.addIceCandidate(
        new RTCIceCandidate(data.candidate)
      );
    }
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    socketRef.current = io(API_BASE_URL);

    socketRef.current.emit('join-call', conversationId);

    socketRef.current.on('offer', handleOffer);
    socketRef.current.on('answer', handleAnswer);
    socketRef.current.on('ice-candidate', handleNewIceCandidate);
    
    // Handle group call participants
    socketRef.current.on('participant-joined', ({ userId }: { userId: string }) => {
      setParticipants(prev => [...prev, userId]);
    });
    
    socketRef.current.on('participant-left', ({ userId }: { userId: string }) => {
      setParticipants(prev => prev.filter(id => id !== userId));
    });

    return () => {
      // Clean up all resources
      if (isRecording) stopCallRecording();
      if (isScreenSharing) stopScreenShare();
      
      socketRef.current?.emit('leave-call', conversationId);
      socketRef.current?.disconnect();
      
      if (liveKitRoomRef.current) {
        liveKitRoomRef.current.disconnect();
      }
      
      if (blurStreamRef.current) {
        blurStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [conversationId, handleOffer, handleAnswer, handleNewIceCandidate, isRecording, isScreenSharing, stopCallRecording, stopScreenShare]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
    
    // Update LiveKit participant if in group call
    if (liveKitRoomRef.current) {
      liveKitRoomRef.current.localParticipant.setAudioEnabled(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
    
    // Update LiveKit participant if in group call
    if (liveKitRoomRef.current) {
      liveKitRoomRef.current.localParticipant.setVideoEnabled(!isVideoEnabled);
    }
  };

  const endCall = () => {
    // Clean up all resources
    if (isRecording) stopCallRecording();
    if (isScreenSharing) stopScreenShare();
    
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    
    if (liveKitRoomRef.current) {
      liveKitRoomRef.current.disconnect();
      liveKitRoomRef.current = null;
    }
    
    setIsCallActive(false);
    setParticipants([]);
    setIsBackgroundBlurEnabled(false);
  };

  return {
    isMuted,
    isVideoEnabled,
    isCallActive,
    isScreenSharing,
    isRecording,
    isBackgroundBlurEnabled,
    participants,
    localVideoRef,
    remoteVideoRef,
    startCall,
    toggleMute,
    toggleVideo,
    toggleBackgroundBlur,
    startScreenShare,
    stopScreenShare,
    startCallRecording,
    stopCallRecording,
    endCall,
  };
}