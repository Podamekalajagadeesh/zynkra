import { Message } from '../../lib/types';
import { Brain } from 'lucide-react';

interface MessageContentProps {
  message: Message;
}

export default function MessageContent({ message }: MessageContentProps) {
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
                <p>🏃 {message.neuralMetadata.context.context.activity}</p>
              )}
            </div>
          )}
        </div>
      )}
      {message.forwardedFrom && (
        <p className="text-xs text-gray-500">Forwarded</p>
      )}
      {message.content && <p className="text-sm">{message.content}</p>}
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
              return <img key={index} src={media.url} alt="media" className="max-w-xs rounded-lg" />;
            }
            if (media.type === 'video') {
              return <video key={index} src={media.url} controls className="max-w-xs rounded-lg" />;
            }
            if (media.type === 'audio') {
              return <audio key={index} src={media.url} controls />;
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}