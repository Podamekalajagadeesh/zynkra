import { useState, useEffect } from 'react';
import { Message } from '../../lib/types';
import { Brain, Lock, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useE2EE } from '../../hooks/useE2EE';
import { API_BASE_URL } from '../../lib/api';
import {
  decryptAttachment,
  isE2eeMessagePayload,
  type AttachmentKeyMaterial,
} from '../../lib/attachment-crypto';

/** Server-relative upload paths need the API origin prefixed. */
const resolveMediaUrl = (url: string) => (url.startsWith('/') ? `${API_BASE_URL}${url}` : url);

interface DecryptedAttachment {
  url: string;
  type: 'image' | 'video' | 'audio';
  objectUrl: string;
}

interface MessageContentProps {
  message: Message;
}

export default function MessageContent({ message }: MessageContentProps) {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decryptedAttachments, setDecryptedAttachments] = useState<DecryptedAttachment[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { user } = useAuth();
  const { decryptMessage, isReady } = useE2EE(user?.id);

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

  // Decrypt message content using Signal Protocol
  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    const decryptContent = async () => {
      if (!message.content || !user) return;

      // Check if content is E2EE (Signal Protocol format: JSON with type and body)
      try {
        const parsed = JSON.parse(message.content);

        // Signal Protocol ciphertext format: { type: number, body: string, version: number }
        if (parsed.type !== undefined && parsed.body && parsed.version) {
          setIsDecrypting(true);
          setDecryptError(false);

          try {
            const decrypted = await decryptMessage(message.sender.id, message.content);
            if (cancelled) return;

            // Phase 3 envelope: { v: 1, text?, attachments?: [{url,type,key,nonce}] }
            let displayText = decrypted;
            let attachments: DecryptedAttachment[] = [];
            try {
              const payload: unknown = JSON.parse(decrypted);
              if (isE2eeMessagePayload(payload)) {
                displayText = payload.text ?? '';
                attachments = await Promise.all(
                  (payload.attachments ?? []).map(async (att) => {
                    const response = await fetch(resolveMediaUrl(att.url));
                    const keyMaterial: AttachmentKeyMaterial = {
                      key: att.key,
                      nonce: att.nonce,
                    };
                    const plaintext = await decryptAttachment(await response.blob(), keyMaterial);
                    const objectUrl = URL.createObjectURL(plaintext);
                    objectUrls.push(objectUrl);
                    return { url: att.url, type: att.type, objectUrl };
                  }),
                );
              }
            } catch {
              // Not a structured payload — the decrypted string is the message text.
            }
            if (cancelled) return;
            setDecryptedAttachments(attachments);
            setDecryptedContent(displayText);
          } catch {
            if (cancelled) return;
            // Old format fallback: check for legacy libsodium format
            if (parsed.nonce && parsed.ciphertext) {
              // Legacy format — show as-is (can't decrypt without old keys)
              setDecryptedContent('[Encrypted message from previous session]');
            } else {
              setDecryptedContent(message.content);
            }
            setDecryptError(false);
          }

          setIsDecrypting(false);
        } else if (parsed.nonce && parsed.ciphertext) {
          // Legacy libsodium format — show placeholder
          setDecryptedContent('[Encrypted message - key exchange required]');
          setIsDecrypting(false);
        } else {
          // Plain text
          setDecryptedContent(message.content);
        }
      } catch {
        // Not JSON — plain text
        setDecryptedContent(message.content);
      }
    };

    decryptContent();
    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [message.content, message.sender.id, user, decryptMessage]);

  const isE2EE = (() => {
    try {
      const p = JSON.parse(message.content);
      return p.type !== undefined && p.body && p.version === 1;
    } catch {
      return false;
    }
  })();

  const speakMessage = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = decryptedContent || message.content;
    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

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
        {isE2EE ? (
          <>
            <ShieldCheck size={12} className="text-green-600 dark:text-green-400" />
            <span className="text-[10px] text-green-600 dark:text-green-400">Encrypted (Signal Protocol)</span>
          </>
        ) : (
          <>
            <Lock size={12} className="text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] text-amber-600 dark:text-amber-400">TLS only — not E2EE</span>
          </>
        )}
      </div>
      {message.forwardedFrom && (
        <p className="text-xs text-gray-500">Forwarded</p>
      )}
      {isDecrypting ? (
        <p className="text-sm text-gray-500">Decrypting message...</p>
      ) : decryptError ? (
        <p className="text-sm text-red-500">Failed to decrypt message</p>
      ) : (
        <div className="flex items-start gap-2">
          <p className="text-sm">{decryptedContent || message.content}</p>
          {('speechSynthesis' in window) && (
            <button
              type="button"
              onClick={speakMessage}
              aria-label={isSpeaking ? 'Stop reading message aloud' : 'Read message aloud'}
              title={isSpeaking ? 'Stop reading message aloud' : 'Read message aloud'}
              className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          )}
        </div>
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
            // E2EE attachments (Phase 3): render the decrypted blob URL when
            // ready; show a placeholder while fetching/decrypting rather than
            // leaking the ciphertext URL to <img>/<video>/<audio> elements.
            const isEnc = 'enc' in media && !!media.enc;
            const decrypted = decryptedAttachments[index];
            if (isEnc && !decrypted) {
              return (
                <div
                  key={index}
                  className="max-w-xs rounded-lg border border-dashed border-neutral-300 p-3 text-xs text-neutral-500"
                >
                  {decryptError ? 'Attachment could not be decrypted' : 'Decrypting attachment…'}
                </div>
              );
            }
            const src = decrypted ? decrypted.objectUrl : resolveMediaUrl(media.url);
            if (media.type === 'image') {
              return <img key={index} src={src} alt="media" className="max-w-xs rounded-lg" />;
            }
            if (media.type === 'video') {
              return <video key={index} src={src} controls className="max-w-xs rounded-lg" />;
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
                  <audio src={src} controls />
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
