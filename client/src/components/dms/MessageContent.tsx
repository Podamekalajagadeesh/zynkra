import { useState, useEffect } from 'react';
import { Message } from '../../lib/types';
import { Brain, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { decryptMessage, getKeys } from '../../services/encryption.service';
import { API_BASE_URL } from '../../lib/api';

/** Server-relative upload paths need the API origin prefixed. */
const resolveMediaUrl = (url: string) => (url.startsWith('/') ? `${API_BASE_URL}${url}` : url);

interface MessageContentProps {
  message: Message;
}

export default function MessageContent({ message }: MessageContentProps) {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const { user } = useAuth();

  // Helper function to get emotion color
  const getEmotionColor = (value: number): string => {
    if (value > 0.7) return 'bg-green-500';
    if (value > 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Format emotion name for display
  const formatEmotionName = (name: string): string => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Decrypt message content if it's encrypted
  useEffect(() => {
    const decryptContent = async () => {
      if (!message.content || !user) return;
      
      // Check if content is encrypted (JSON string with nonce and ciphertext)
      try {
        const parsed = JSON.parse(message.content);
        if (parsed.nonce && parsed.ciphertext) {
          setIsDecrypting(true);
          const keys = await getKeys(user.id);
          if (keys) {
            // Get sender's public key - in a real app, this would come from the message sender
            const senderPublicKeyBytes = new Uint8Array(atob(message.sender.publicKey || '').split('').map(c => c.charCodeAt(0)));
            const decrypted = await decryptMessage(senderPublicKeyBytes, keys.privateKey, message.content);
            setDecryptedContent(decrypted);
          }
          setIsDecrypting(false);
        } else {
          setDecryptedContent(message.content);
        }
      } catch (e) {
        // Content is not encrypted, use as is
        setDecryptedContent(message.content);
      }
    };

    decryptContent();
  }, [message.content, message.sender, user]);

  return (
    <div>
      {message.isNeural && (
        <div className="mb-2 p-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-1 mb-1">
            <Brain size={14} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Telepathic Message</span>
          </div>
          
          {/* Display emotions if available */}
          {message.neuralMetadata?.emotions && (
            <div className="mt-2">
              <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Emotional state:</p>
              <div className="grid grid-cols-4 gap-1">
                {Object.entries(message.neuralMetadata.emotions).map(([emotion, value]) => (
                  <div key={emotion} className="flex flex-col items-center">
                    <div className={`w-full h-1.5 rounded-full ${getEmotionColor(value)}`}></div>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">{formatEmotionName(emotion)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Display context if available */}
          {message.neuralMetadata?.context && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {message.neuralMetadata.context.location?.name && (
                <p>📍 {message.neuralMetadata.context.location.name}</p>
              )}
              {message.neuralMetadata.context.activity && (
                <p>🏃 {message.neuralMetadata.context.activity}</p>
              )}
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-1 mb-1">
        <Lock size={12} className="text-green-600 dark:text-green-400" />
        <span className="text-[10px] text-green-600 dark:text-green-400">End-to-end encrypted</span>
      </div>
      {message.forwardedFrom && (
        <p className="text-xs text-gray-500">Forwarded</p>
      )}
      {isDecrypting ? (
        <p className="text-sm text-gray-500">Decrypting message...</p>
      ) : (
        <p className="text-sm">{decryptedContent || message.content}</p>
      )}
      {message.gift && (
        <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
          <div className="flex items-center gap-3">
            <img src={message.gift.imageUrl} alt={message.gift.name} className="w-12 h-12" />
            <div>
              <p className="text-sm font-semibold text-purple-800">🎁 {message.gift.name}</p>
              {message.gift.message && <p className="text-xs text-gray-600 mt-1">{message.gift.message}</p>}
            </div>
          </div>
        </div>
      )}
      {message.media && message.media.length > 0 && (
        <div className="mt-2 grid gap-2 grid-cols-1">
          {message.media.map((media, index) => {
            if (media.type === 'image') {
              return <img key={index} src={resolveMediaUrl(media.url)} alt="media" className="max-w-xs rounded-lg" />;
            }
            if (media.type === 'video') {
              return <video key={index} src={resolveMediaUrl(media.url)} controls className="max-w-xs rounded-lg" />;
            }
            if (media.type === 'audio') {
              return (
                <div key={index}>
                  {message.voiceNote && (
                    <div className="mb-1 flex items-end gap-[2px]" aria-hidden>
                      {message.voiceNote.waveform.map((v, i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-primary-500/70"
                          style={{ height: `${Math.max(3, Math.round(v * 24))}px` }}
                        />
                      ))}
                      <span className="ml-2 text-xs text-gray-500">
                        {Math.floor(message.voiceNote.durationSeconds / 60)}:
                        {String(Math.round(message.voiceNote.durationSeconds % 60)).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  <audio src={resolveMediaUrl(media.url)} controls />
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}