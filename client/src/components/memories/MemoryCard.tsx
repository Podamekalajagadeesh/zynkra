import React, { useState } from 'react';
import { Play, Pause, Download, MapPin, Calendar, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar } from '../Avatar';
import type { Post } from '../../lib/types';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';

interface MemoryCardProps {
  post: Post;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ post }) => {
  const { addToast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSensoryTab, setActiveSensoryTab] = useState<'visual' | 'audio' | 'all'>('all');
  const memory = post.memoryMetadata;
  if (!memory || !post.isMemory) return null;

  const handleReplay = async () => {
    if (!memory.privacySettings.allowReplay) {
      addToast({ type: 'error', message: 'Replay is not allowed for this memory' });
      return;
    }
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      addToast({ type: 'info', message: 'Playing full sensory memory experience...' });
    }
  };

  const handleDownload = async () => {
    if (!memory.privacySettings.allowDownload) {
      addToast({ type: 'error', message: 'Download is not allowed for this memory' });
      return;
    }
    try {
      const response = await api.get(`/memories/${post.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `memory-${post.id}.zip`);
      document.body.appendChild(link);
      link.click();
      addToast({ type: 'success', message: 'Memory downloaded successfully' });
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to download memory' });
    }
  };

  const emotionColors: Record<string, string> = {
    joy: 'bg-yellow-400',
    sadness: 'bg-blue-400',
    excitement: 'bg-orange-400',
    calm: 'bg-green-400',
    anger: 'bg-red-500',
    surprise: 'bg-pink-400',
    love: 'bg-rose-500',
    fear: 'bg-purple-400',
  };

  const emotionLabels: Record<string, string> = {
    joy: 'Joy',
    sadness: 'Sadness',
    excitement: 'Excitement',
    calm: 'Calm',
    anger: 'Anger',
    surprise: 'Surprise',
    love: 'Love',
    fear: 'Fear',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <Avatar src={post.author.profilePhoto} alt={post.author.displayName} />
        <div>
          <p className="font-semibold">{post.author.displayName}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{new Date(memory.neuralTimestamp).toLocaleDateString()}</span>
            {memory.context.location?.name && (
              <>
                <MapPin className="h-3 w-3 ml-2" />
                <span>{memory.context.location.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Memory content */}
      <div className="p-4">
        <p className="text-gray-800 dark:text-gray-200 mb-4">{post.content}</p>

        {/* Sensory media player */}
        {(memory.sensory.visual?.length > 0 || memory.sensory.audio?.length > 0) && (
          <div className="mb-4">
            <div className="flex gap-2 mb-3">
              <Button
                variant={activeSensoryTab === 'all' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setActiveSensoryTab('all')}
              >
                All
              </Button>
              {memory.sensory.visual && memory.sensory.visual.length > 0 && (
                <Button
                  variant={activeSensoryTab === 'visual' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveSensoryTab('visual')}
                >
                  👁️ Visual ({memory.sensory.visual.length})
                </Button>
              )}
              {memory.sensory.audio && memory.sensory.audio.length > 0 && (
                <Button
                  variant={activeSensoryTab === 'audio' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveSensoryTab('audio')}
                >
                  👂 Audio ({memory.sensory.audio.length})
                </Button>
              )}
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
              {isPlaying ? (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center animate-pulse">
                    <Play className="h-8 w-8 text-primary-600" />
                  </div>
                  <p className="text-sm text-gray-500">Sensory playback active...</p>
                  <Button onClick={handleReplay} className="mt-4">
                    <Pause className="mr-2 h-4 w-4" />
                    Pause Playback
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {(activeSensoryTab === 'all' || activeSensoryTab === 'visual') &&
                      memory.sensory.visual?.slice(0, 6).map((file, i) => (
                        <img
                          key={i}
                          src={file.url}
                          alt={`visual-${i}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      ))}
                  </div>
                  <Button onClick={handleReplay} disabled={!memory.privacySettings.allowReplay}>
                    <Play className="mr-2 h-4 w-4" />
                    {memory.privacySettings.allowReplay ? 'Replay Full Experience' : 'Replay Disabled'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emotional context visualization */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-semibold mb-3">Emotional Context</h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(memory.emotions).map(([emotion, value]) =>
              value > 0 ? (
                <div key={emotion} className="text-center">
                  <div
                    className={`h-16 ${emotionColors[emotion]} rounded-t-md transition-all`}
                    style={{ height: `${Math.max(value * 0.16, 4)}px` }}
                  />
                  <p className="text-xs mt-1 capitalize">{emotionLabels[emotion]}</p>
                  <p className="text-xs text-gray-500">{value}%</p>
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" size="sm">
            <Heart className="mr-2 h-4 w-4" />
            {post.likes.length}
          </Button>
          <Button variant="ghost" size="sm">
            <MessageCircle className="mr-2 h-4 w-4" />
            {post.comments.length}
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            {post.shareCount || 0}
          </Button>
          {memory.privacySettings.allowDownload && (
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};