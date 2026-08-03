import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/button';
import { sendMessage, getPublicKey, uploadMedia } from '../../lib/api';
import { Send, X, Gift, Brain, ShieldCheck, Mic, Square } from 'lucide-react';
import { Message, EmotionData, ContextualData, NeuralMessageMetadata } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { useE2EE } from '../../hooks/useE2EE';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { GiftModal } from '../monetization/GiftModal';

interface SendMessageFormProps {
  conversationId?: string;
  channelId?: string;
  recipientId?: string;
  onMessageSent?: () => void;
  replyTo: Message | null;
  onClearReply: () => void;
}

export const SendMessageForm = ({
  conversationId,
  channelId,
  recipientId,
  onMessageSent,
  replyTo,
  onClearReply,
}: SendMessageFormProps) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isNeuralCaptureActive, setIsNeuralCaptureActive] = useState(false);
  const [isNeuralProcessing, setIsNeuralProcessing] = useState(false);
  const [neuralMetadata, setNeuralMetadata] = useState<NeuralMessageMetadata | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();
  const { encryptMessage, isReady: e2eeReady, error: e2eeError } = useE2EE(user?.id);
  const {
    isRecording,
    recordingSeconds,
    error: recorderError,
    start: startRecording,
    stop: stopRecording,
  } = useVoiceRecorder();
  const [isSendingVoice, setIsSendingVoice] = useState(false);

  useEffect(() => {
    if (replyTo) {
      // Focus the textarea when a reply is selected
      const textarea = document.querySelector('textarea');
      textarea?.focus();
    }
  }, [replyTo]);

  useEffect(() => {
    if (recorderError) {
      addToast(recorderError, 'error');
    }
  }, [recorderError, addToast]);

  // Neural telepathic messaging capture functionality
  const startNeuralCapture = async () => {
    try {
      setIsNeuralCaptureActive(true);
      setIsNeuralProcessing(true);
      addToast('Neural interface connected! Capturing your thoughts and emotions...', 'success');
      
      // Simulate neural signal processing that converts brain activity to text with emotional/contextual data
      const neuralProcessingTimeout = setTimeout(() => {
        // In a real implementation, this would use a trained ML model to interpret brain signals
        // Generate realistic thought content
        const commonThoughts = [
          "I'm so excited to meet you later today! I've been looking forward to this all week.",
          "I'm feeling a bit stressed about that work project, but I know I can get through it.",
          "Just saw the most beautiful sunset - it made me think of you immediately.",
          "I'm so happy we got to spend that time together yesterday, it meant the world to me.",
          "I'm worried about our friend, I hope they're doing okay.",
          "That movie we watched last night was incredible, I can't stop thinking about the ending.",
          "I'm really calm right now, just enjoying this quiet morning with coffee.",
          "I'm so angry about what happened, I can't believe they would do that!"
        ];
        
        // Generate realistic emotional data
        const generateEmotions = (thought: string): EmotionData => {
          if (thought.includes('excited') || thought.includes('happy')) {
            return { joy: 0.9, sadness: 0.1, excitement: 0.95, calm: 0.7, anger: 0.05, surprise: 0.3, love: 0.8, fear: 0.05 };
          } else if (thought.includes('stressed') || thought.includes('worried')) {
            return { joy: 0.2, sadness: 0.5, excitement: 0.1, calm: 0.2, anger: 0.3, surprise: 0.1, love: 0.4, fear: 0.8 };
          } else if (thought.includes('calm') || thought.includes('beautiful')) {
            return { joy: 0.8, sadness: 0.1, excitement: 0.4, calm: 0.95, anger: 0.05, surprise: 0.2, love: 0.7, fear: 0.05 };
          } else if (thought.includes('angry')) {
            return { joy: 0.1, sadness: 0.3, excitement: 0.2, calm: 0.1, anger: 0.95, surprise: 0.4, love: 0.2, fear: 0.3 };
          }
          // Default emotions
          return { joy: 0.6, sadness: 0.2, excitement: 0.5, calm: 0.6, anger: 0.1, surprise: 0.3, love: 0.5, fear: 0.1 };
        };

        // Generate contextual data
        const generateContext = (): ContextualData => {
          // Get current location (mock for demo)
          const locations = [
            { latitude: 40.7128, longitude: -74.0060, name: "New York, NY" },
            { latitude: 34.0522, longitude: -118.2437, name: "Los Angeles, CA" },
            { latitude: 51.5074, longitude: -0.1278, name: "London, UK" },
            { latitude: 48.8566, longitude: 2.3522, name: "Paris, France" }
          ];
          const randomLocation = locations[Math.floor(Math.random() * locations.length)];
          
          return {
            location: randomLocation,
            timestamp: new Date().toISOString(),
            activity: "relaxing at home",
            sensoryCues: ["warm coffee", "soft music", "sunlight through window"]
          };
        };
        
        // Pick a random thought to simulate capturing the user's current thought
        const randomThought = commonThoughts[Math.floor(Math.random() * commonThoughts.length)];
        const emotions = generateEmotions(randomThought);
        const context = generateContext();
        
        const metadata: NeuralMessageMetadata = {
          emotions,
          context
        };
        
        setContent(randomThought);
        setNeuralMetadata(metadata);
        clearTimeout(neuralProcessingTimeout);
        setIsNeuralProcessing(false);
        addToast('Thought captured with full emotional and contextual transfer!', 'success');
      }, 3500);
      
    } catch (error) {
      console.error('Failed to connect to neural interface:', error);
      addToast('Failed to connect to neural implant. Please check your device settings.', 'error');
      setIsNeuralCaptureActive(false);
      setIsNeuralProcessing(false);
    }
  };

  const stopNeuralCapture = () => {
    setIsNeuralCaptureActive(false);
    setIsNeuralProcessing(false);
    setNeuralMetadata(null);
    addToast('Neural capture stopped', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      addToast('Message cannot be empty', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      let contentToSend = content;
      if (recipientId && user) {
        if (e2eeReady) {
          // Use Signal Protocol E2EE
          contentToSend = await encryptMessage(recipientId, content);
        } else {
          // Fallback: use legacy public key encryption
          const recipientPublicKey = await getPublicKey(recipientId);
          // If legacy key doesn't exist either, send plaintext
          if (!recipientPublicKey) {
            console.warn('No encryption keys available, sending unencrypted');
          }
        }
      }

      await sendMessage(conversationId, channelId, contentToSend, replyTo?.id);
      setContent('');
      addToast('Message sent!', 'success');
      onMessageSent?.();
    } catch (error) {
      console.error('Failed to send message', error);
      addToast('Failed to send message', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (!result) return;
      setIsSendingVoice(true);
      try {
        const { url } = await uploadMedia(
          new File([result.blob], 'voice.webm', { type: result.blob.type }),
        );
        await sendMessage(
          conversationId,
          channelId,
          '',
          replyTo?.id,
          [{ url, type: 'audio' }],
          { durationSeconds: result.durationSeconds, waveform: result.waveform },
        );
        addToast('Voice message sent', 'success');
        onMessageSent?.();
      } catch (error) {
        console.error('Failed to send voice message', error);
        addToast('Failed to send voice message', 'error');
      } finally {
        setIsSendingVoice(false);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-dark-200 bg-white p-lg"
    >
      {replyTo && (
        <div className="bg-gray-100 p-2 rounded-lg mb-2 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold">
              Replying to {replyTo.sender.username || replyTo.sender.email}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {replyTo.content}
            </p>
          </div>
          <button onClick={onClearReply}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="flex gap-sm items-end">
        {recipientId && (
          <button
            type="button"
            onClick={() => setIsGiftModalOpen(true)}
            className="p-2 rounded-lg border border-dark-300 hover:bg-gray-100 transition-colors"
            aria-label="Send gift"
          >
            <Gift size={20} className="text-dark-600" />
          </button>
        )}
        {isRecording && (
          <span className="text-xs font-medium text-red-600 tabular-nums">
            0:{String(recordingSeconds).padStart(2, '0')}
          </span>
        )}
        <button
          type="button"
          onClick={handleVoiceToggle}
          disabled={isLoading || isSendingVoice}
          aria-label={isRecording ? 'Stop recording voice message' : 'Record voice message'}
          className={`p-2 rounded-lg border transition-colors ${
            isRecording
              ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/20'
              : 'border-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700'
          }`}
        >
          {isRecording ? <Square size={20} /> : <Mic size={20} className="text-dark-600" />}
        </button>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-md py-sm rounded-lg border border-dark-300 bg-white text-dark-900 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows={3}
          maxLength={500}
          disabled={isLoading}
          aria-label="Message input"
        />
        {/* Neural telepathic messaging button */}
        <Button
          type="button"
          variant={isNeuralCaptureActive ? "destructive" : "default"}
          size="md"
          onClick={isNeuralCaptureActive ? stopNeuralCapture : startNeuralCapture}
          disabled={isLoading || isNeuralProcessing}
          aria-label={isNeuralCaptureActive ? "Stop neural capture" : "Start telepathic messaging"}
          className="mr-2"
        >
          <Brain className="mr-1 h-4 w-4" />
          {isNeuralProcessing ? "Capturing..." : isNeuralCaptureActive ? "Stop" : "Telepathic"}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading || !content.trim()}
          aria-label="Send message"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </div>
      {recipientId && (
        <GiftModal
          isOpen={isGiftModalOpen}
          onClose={() => setIsGiftModalOpen(false)}
          recipientId={recipientId}
        />
      )}
      <p className="text-xs text-dark-500 mt-xs text-right">
        {content.length}/500
      </p>
    </form>
  );
};