
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Mic, StopCircle, Music, Filter } from 'lucide-react';

const AudioContentTools = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);
      audioChunksRef.current = [];
    };
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Audio Content Tools</h3>
      <div className="flex items-center space-x-4">
        {!isRecording ? (
          <Button onClick={handleStartRecording} className="flex items-center space-x-2">
            <Mic className="w-5 h-5" />
            <span>Record Podcast</span>
          </Button>
        ) : (
          <Button onClick={handleStopRecording} className="flex items-center space-x-2">
            <StopCircle className="w-5 h-5" />
            <span>Stop Recording</span>
          </Button>
        )}
        <Button className="flex items-center space-x-2">
          <Music className="w-5 h-5" />
          <span>Add Music</span>
        </Button>
        <Button className="flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <span>Voice Filters</span>
        </Button>
      </div>
      {audioUrl && (
        <div className="mt-4">
          <audio controls src={audioUrl} />
        </div>
      )}
    </div>
  );
};

export default AudioContentTools;