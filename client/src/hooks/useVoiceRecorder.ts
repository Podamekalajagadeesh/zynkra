import { useCallback, useRef, useState } from 'react';

export interface VoiceRecordingResult {
  blob: Blob;
  durationSeconds: number;
  waveform: number[];
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const waveformRef = useRef<number[]>([]);
  const startedAtRef = useRef(0);
  const sampleTimerRef = useRef<number | null>(null);
  const countTimerRef = useRef<number | null>(null);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Voice recording is not supported in this browser');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      waveformRef.current = [];
      startedAtRef.current = Date.now();

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start(250);
      recorderRef.current = recorder;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setIsRecording(true);
      setRecordingSeconds(0);

      sampleTimerRef.current = window.setInterval(() => {
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const value of data) {
          sum += Math.abs(value - 128) / 128;
        }
        waveformRef.current.push(Math.min(1, (sum / data.length) * 3));
      }, 150);

      countTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);
    } catch {
      setError('Microphone access was denied');
    }
  }, []);

  const stop = useCallback(async (): Promise<VoiceRecordingResult | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      cancel();
      return null;
    }
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanup();
        setIsRecording(false);
        setRecordingSeconds(0);
        resolve({ blob, durationSeconds, waveform: waveformRef.current.slice(0, 48) });
      };
      recorder.stop();
    });
  }, []);

  const cancel = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setRecordingSeconds(0);
  }, []);

  const cleanup = () => {
    if (sampleTimerRef.current) window.clearInterval(sampleTimerRef.current);
    if (countTimerRef.current) window.clearInterval(countTimerRef.current);
    sampleTimerRef.current = null;
    countTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    analyserRef.current = null;
    recorderRef.current = null;
  };

  return { isRecording, recordingSeconds, error, start, stop, cancel };
}
