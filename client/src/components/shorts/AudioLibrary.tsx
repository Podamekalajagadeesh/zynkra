import React from 'react';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
}

const sampleAudio: AudioTrack[] = [
  { id: '1', title: 'Upbeat Funk', artist: 'Artist A', url: '/audio/upbeat-funk.mp3' },
  { id: '2', title: 'Chill Lo-fi', artist: 'Artist B', url: '/audio/chill-lofi.mp3' },
  { id: '3', title: 'Epic Cinematic', artist: 'Artist C', url: '/audio/epic-cinematic.mp3' },
];

interface AudioLibraryProps {
  onSelect: (track: AudioTrack) => void;
  onClose: () => void;
}

const AudioLibrary = ({ onSelect, onClose }: AudioLibraryProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Audio Library</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>
        <div className="space-y-4">
          {sampleAudio.map(track => (
            <div key={track.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div>
                <p className="font-semibold">{track.title}</p>
                <p className="text-sm text-gray-400">{track.artist}</p>
              </div>
              <Button onClick={() => onSelect(track)}>Select</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AudioLibrary;