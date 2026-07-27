import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Mic, MicOff, Pause, Play, Save, Trash2, X, Volume2, ListMusic } from 'lucide-react';

// Voice filter presets using Web Audio API
const VOICE_FILTERS = [
  { id: 'normal', name: 'Normal', gain: 1, pitch: 1 },
  { id: 'deep', name: 'Deep Voice', gain: 1.1, pitch: 0.7 },
  { id: 'high', name: 'High Voice', gain: 0.9, pitch: 1.3 },
  { id: 'robot', name: 'Robot', gain: 1, pitch: 0.8, distortion: 20 },
  { id: 'echo', name: 'Echo', gain: 0.8, pitch: 1, delay: 0.3 },
  { id: 'helium', name: 'Helium', gain: 0.9, pitch: 1.5 },
];

// Background music library
const BACKGROUND_MUSIC = [
  { id: 'lofi', title: 'Chill Lofi', artist: 'Ambient Beats', url: '/audio/lofi-podcast.mp3', volume: 0.2 },
  { id: 'jazz', title: 'Smooth Jazz', artist: 'Jazz Collective', url: '/audio/jazz-podcast.mp3', volume: 0.15 },
  { id: 'ambient', title: 'Ambient Calm', artist: 'Nature Sounds', url: '/audio/ambient-podcast.mp3', volume: 0.1 },
];

interface PodcastRecorderProps {
  onClose: () => void;
  onSave: (audioBlob: Blob, metadata: { title: string; duration: number }) => void;
}

const PodcastRecorder = ({ onClose, onSave }: PodcastRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [selectedFilter, setSelectedFilter] = useState(VOICE_FILTERS[0]);
  const [selectedMusic, setSelectedMusic] = useState<typeof BACKGROUND_MUSIC[0] | null>(null);
  const [recordedTime, setRecordedTime] = useState(0);
  const [podcastTitle, setPodcastTitle] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const distortionNodeRef = useRef<WaveShaperNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Web Audio API for voice filters
  const initAudioContext = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      setAudioContext(ctx);
      
      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      
      const gainNode = ctx.createGain();
      gainNodeRef.current = gainNode;
      
      // Create destination to record processed audio
      const dest = ctx.createMediaStreamDestination();
      
      source.connect(gainNode);
      gainNode.connect(dest);
      
      const recorder = new MediaRecorder(dest.stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedChunks(prev => [...prev, e.data]);
        }
      };
      
      setMediaRecorder(recorder);
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  };

  // Apply voice filter
  const applyVoiceFilter = (filter: typeof VOICE_FILTERS[0]) => {
    if (!audioContext || !gainNodeRef.current) return;
    
    // Reset nodes
    if (distortionNodeRef.current) distortionNodeRef.current.disconnect();
    if (delayNodeRef.current) delayNodeRef.current.disconnect();
    
    gainNodeRef.current.gain.setValueAtTime(filter.gain, audioContext.currentTime);
    
    // Pitch modification (simplified)
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current.connect(gainNodeRef.current);
    }
    
    // Add distortion if needed
    if (filter.distortion) {
      const distortion = audioContext.createWaveShaper();
      const makeDistortionCurve = (amount: number) => {
        const k = amount;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
          const x = i * 2 / n_samples - 1;
          curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
      }
      distortion.curve = makeDistortionCurve(filter.distortion);
      distortionNodeRef.current = distortion;
      
      gainNodeRef.current.disconnect();
      gainNodeRef.current.connect(distortion);
      if (sourceNodeRef.current) sourceNodeRef.current.connect(gainNodeRef.current);
      distortion.connect(audioContext.destination);
    }
    
    // Add delay if needed
    if (filter.delay) {
      const delay = audioContext.createDelay(5.0);
      delay.delayTime.setValueAtTime(filter.delay, audioContext.currentTime);
      const feedback = audioContext.createGain();
      feedback.gain.value = 0.4;
      delay.connect(feedback);
      feedback.connect(delay);
      delayNodeRef.current = delay;
      
      gainNodeRef.current.connect(delay);
      delay.connect(audioContext.destination);
    }
    
    setSelectedFilter(filter);
  };

  // Play background music
  const playBackgroundMusic = (music: typeof BACKGROUND_MUSIC[0]) => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
    }
    
    const audio = new Audio(music.url);
    audio.loop = true;
    audio.volume = music.volume;
    audio.play().catch(console.error);
    musicAudioRef.current = audio;
    setSelectedMusic(music);
    setShowMusic(false);
  };

  // Start recording
  const startRecording = () => {
    if (!mediaRecorder) return;
    
    mediaRecorder.start();
    setIsRecording(true);
    setIsPaused(false);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordedTime(prev => prev + 1);
    }, 1000);
  };

  // Pause recording
  const pauseRecording = () => {
    if (!mediaRecorder) return;
    
    if (isPaused) {
      mediaRecorder.resume();
      timerRef.current = setInterval(() => {
        setRecordedTime(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorder.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    setIsPaused(!isPaused);
  };

  // Stop recording
  const stopRecording = () => {
    if (!mediaRecorder) return;
    
    mediaRecorder.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Stop music
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
    
    // Create preview URL
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
  };

  // Preview recording
  const previewRecording = () => {
    if (!previewUrl || previewAudioRef.current) return;
    
    const audio = new Audio(previewUrl);
    previewAudioRef.current = audio;
    audio.play();
    setIsPreviewing(true);
    
    audio.onended = () => {
      setIsPreviewing(false);
      previewAudioRef.current = null;
    };
  };

  // Save podcast
  const savePodcast = () => {
    if (!previewUrl || !podcastTitle.trim()) return;
    
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    onSave(blob, {
      title: podcastTitle,
      duration: recordedTime
    });
    
    // Cleanup
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  // Discard recording
  const discardRecording = () => {
    setRecordedChunks([]);
    setPreviewUrl(null);
    setRecordedTime(0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize on mount
  useEffect(() => {
    initAudioContext();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContext) audioContext.close();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Podcast Recorder</h2>
          <Button variant="ghost" size="icon" onClick={discardRecording}>
            <X className="text-white" size={24} />
          </Button>
        </div>

        {/* Title Input */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Enter podcast title..."
            value={podcastTitle}
            onChange={(e) => setPodcastTitle(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Recording Timer */}
        <div className="text-center mb-8">
          <div className="text-6xl font-mono text-white mb-4">
            {formatTime(recordedTime)}
          </div>
          {isRecording && (
            <div className="flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-red-500">Recording</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center space-x-4 mb-8">
          {!isRecording && !previewUrl && (
            <Button
              variant="default"
              size="lg"
              className="rounded-full h-16 w-16 bg-red-600 hover:bg-red-700"
              onClick={startRecording}
            >
              <Mic size={32} />
            </Button>
          )}
          
          {isRecording && (
            <>
              <Button
                variant="default"
                size="lg"
                className="rounded-full h-14 w-14 bg-yellow-600 hover:bg-yellow-700"
                onClick={pauseRecording}
              >
                {isPaused ? <Play size={24} /> : <Pause size={24} />}
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full h-16 w-16 bg-gray-600 hover:bg-gray-700"
                onClick={stopRecording}
              >
                <MicOff size={32} />
              </Button>
            </>
          )}

          {previewUrl && !isPreviewing && (
            <Button
              variant="default"
              size="lg"
              className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700"
              onClick={previewRecording}
            >
              <Play size={24} />
            </Button>
          )}
        </div>

        {/* Voice Filters */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center bg-gray-800 hover:bg-gray-700"
            onClick={() => setShowFilters(!showFilters)}
          >
            <div className="flex items-center">
              <Volume2 className="mr-2" size={20} />
              <span>Voice Filter: {selectedFilter.name}</span>
            </div>
            <span>{showFilters ? '▲' : '▼'}</span>
          </Button>
          
          {showFilters && (
            <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-gray-800 rounded-lg">
              {VOICE_FILTERS.map(filter => (
                <Button
                  key={filter.id}
                  variant={selectedFilter.id === filter.id ? 'default' : 'ghost'}
                  className="justify-start"
                  onClick={() => applyVoiceFilter(filter)}
                >
                  {filter.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Background Music */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center bg-gray-800 hover:bg-gray-700"
            onClick={() => setShowMusic(!showMusic)}
          >
            <div className="flex items-center">
              <ListMusic className="mr-2" size={20} />
              <span>Background Music: {selectedMusic ? selectedMusic.title : 'None'}</span>
            </div>
            <span>{showMusic ? '▲' : '▼'}</span>
          </Button>
          
          {showMusic && (
            <div className="mt-2 space-y-2 p-2 bg-gray-800 rounded-lg">
              <Button
                variant={!selectedMusic ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  if (musicAudioRef.current) {
                    musicAudioRef.current.pause();
                    musicAudioRef.current = null;
                  }
                  setSelectedMusic(null);
                  setShowMusic(false);
                }}
              >
                No Music
              </Button>
              {BACKGROUND_MUSIC.map(music => (
                <Button
                  key={music.id}
                  variant={selectedMusic?.id === music.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => playBackgroundMusic(music)}
                >
                  <div className="text-left">
                    <p>{music.title}</p>
                    <p className="text-xs text-gray-400">{music.artist}</p>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        {previewUrl && (
          <div className="flex justify-end space-x-4">
            <Button
              variant="destructive"
              onClick={discardRecording}
              className="flex items-center"
            >
              <Trash2 className="mr-2" size={16} />
              Discard
            </Button>
            <Button
              variant="default"
              onClick={savePodcast}
              disabled={!podcastTitle.trim()}
              className="flex items-center bg-green-600 hover:bg-green-700"
            >
              <Save className="mr-2" size={16} />
              Save Podcast
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PodcastRecorder;