import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const Streaming: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = io('ws://localhost:8080');

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('stream', (data) => {
      if (videoRef.current) {
        videoRef.current.src = `data:image/jpeg;base64,${data}`;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Live Stream</h1>
      <video ref={videoRef} width="720" height="480" controls autoPlay></video>
    </div>
  );
};

export default Streaming;