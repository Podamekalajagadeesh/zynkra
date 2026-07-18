import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, Download, MapPin, Calendar, Heart, MessageCircle, Share2, PencilLine, Sparkles, MessageSquarePlus, ArrowLeftRight, Clock3, Globe, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar } from '../Avatar';
import type { Post, RealityContext } from '../../lib/types';
import { useToast } from '../../contexts/ToastContext';
import api, { portMemory } from '../../lib/api';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { MemoryEditRevision, MemoryEditType } from '../../lib/types';

interface MemoryCardProps {
  post: Post;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ post }) => {
  const { addToast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSensoryTab, setActiveSensoryTab] = useState<'visual' | 'audio' | 'all'>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [showPortEditor, setShowPortEditor] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);
  const [revisions, setRevisions] = useState<MemoryEditRevision[]>(post.memoryRevisions ?? []);
  const [revisionForm, setRevisionForm] = useState({
    editType: 'annotation' as MemoryEditType,
    title: '',
    annotation: '',
    sensoryNote: '',
    contextNote: '',
    sensoryEnhancements: '',
  });
  const [portForm, setPortForm] = useState({
    targetReality: 'virtual' as RealityContext,
    sourceReality: (post.realityContext ?? 'neural') as RealityContext,
    contextNote: '',
    fidelity: 'full',
  });
  const memory = currentPost.memoryMetadata;
  const ports = currentPost.crossRealityPorts ?? [];

  useEffect(() => {
    setCurrentPost(post);
    setRevisions(post.memoryRevisions ?? []);
    setPortForm((current) => ({
      ...current,
      sourceReality: (post.realityContext ?? 'neural') as RealityContext,
    }));
  }, [post]);

  if (!memory || !post.isMemory) return null;

  const sortedRevisions = useMemo(() => [...revisions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [revisions]);

  const loadRevisions = async () => {
    try {
      const response = await api.get(`/memories/${post.id}/revisions`);
      setRevisions(response.data);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load memory edits' });
    }
  };

  const createRevision = async () => {
    try {
      await api.post(`/memories/${post.id}/revisions`, {
        editType: revisionForm.editType,
        title: revisionForm.title || undefined,
        annotation: revisionForm.annotation || undefined,
        sensoryNote: revisionForm.sensoryNote || undefined,
        contextNote: revisionForm.contextNote || undefined,
        sensoryEnhancements: revisionForm.sensoryEnhancements ? JSON.parse(revisionForm.sensoryEnhancements) : undefined,
      });
      addToast({ type: 'success', message: 'Memory edit saved without changing the original' });
      setRevisionForm({
        editType: 'annotation',
        title: '',
        annotation: '',
        sensoryNote: '',
        contextNote: '',
        sensoryEnhancements: '',
      });
      setShowEditor(false);
      await loadRevisions();
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to save memory edit' });
    }
  };

  const handlePortMemory = async () => {
    try {
      const updatedMemory = await portMemory(currentPost.id, {
        targetReality: portForm.targetReality,
        sourceReality: portForm.sourceReality,
        contextNote: portForm.contextNote || undefined,
        fidelity: portForm.fidelity,
      });
      setCurrentPost(updatedMemory);
      setPortForm((current) => ({
        ...current,
        sourceReality: updatedMemory.realityContext ?? current.sourceReality,
        contextNote: '',
      }));
      setShowPortEditor(false);
      addToast({ type: 'success', message: `Memory ported to ${updatedMemory.realityContext} reality` });
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to port memory across realities' });
    }
  };

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
            {currentPost.realityContext && (
              <Badge variant="secondary" className="ml-2 capitalize">
                <Globe className="mr-1 h-3 w-3" />
                {currentPost.realityContext}
              </Badge>
            )}
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

        {currentPost.authenticityAnalysis && (
          <div className="mb-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {currentPost.authenticityAnalysis.verdict === 'likely_authentic' ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                ) : currentPost.authenticityAnalysis.verdict === 'likely_synthetic' ? (
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-sky-600" />
                )}
                <h4 className="text-sm font-semibold">Neural authenticity check</h4>
              </div>
              <Badge variant={currentPost.authenticityAnalysis.verdict === 'likely_authentic' ? 'secondary' : 'outline'} className="capitalize">
                {currentPost.authenticityAnalysis.verdict.replaceAll('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Confidence {Math.round(currentPost.authenticityAnalysis.confidence * 100)}% • Score {currentPost.authenticityAnalysis.score.toFixed(2)}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {currentPost.authenticityAnalysis.signals.slice(0, 4).map((signal) => (
                <li key={signal} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary-500" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
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

        {/* Non-destructive memory editing */}
        <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h4 className="text-sm font-semibold">Memory editing tools</h4>
              <p className="text-xs text-gray-500">Add annotations, context, or sensory enhancements without changing the original memory.</p>
            </div>
            <Button variant="outline" size="sm" onClick={async () => { setShowEditor((value) => !value); if (!showEditor) await loadRevisions(); }}>
              <PencilLine className="mr-2 h-4 w-4" />
              {showEditor ? 'Close editor' : 'Edit memory'}
            </Button>
          </div>

          {showEditor && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Edit type</label>
                  <Select value={revisionForm.editType} onValueChange={(value) => setRevisionForm((current) => ({ ...current, editType: value as MemoryEditType }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annotation">Annotation</SelectItem>
                      <SelectItem value="context">Context</SelectItem>
                      <SelectItem value="sensory_enhancement">Sensory enhancement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Optional title</label>
                  <Input value={revisionForm.title} onChange={(e) => setRevisionForm((current) => ({ ...current, title: e.target.value }))} placeholder="Add a label for this revision" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Annotation</label>
                <Textarea value={revisionForm.annotation} onChange={(e) => setRevisionForm((current) => ({ ...current, annotation: e.target.value }))} rows={3} placeholder="Add context or a note about the memory" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Context note</label>
                <Textarea value={revisionForm.contextNote} onChange={(e) => setRevisionForm((current) => ({ ...current, contextNote: e.target.value }))} rows={2} placeholder="Explain what this memory means now" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sensory enhancement JSON</label>
                <Textarea value={revisionForm.sensoryEnhancements} onChange={(e) => setRevisionForm((current) => ({ ...current, sensoryEnhancements: e.target.value }))} rows={3} placeholder='{"visual": [{"url": "https://...", "type": "image"}]}' />
              </div>

              <div className="flex justify-end">
                <Button onClick={createRevision}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Save non-destructive edit
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4 w-4 text-gray-500" />
                  <h5 className="text-sm font-semibold">Revision history</h5>
                </div>
                {sortedRevisions.length > 0 ? (
                  <div className="space-y-2">
                    {sortedRevisions.map((revision) => (
                      <div key={revision.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{revision.editType.replaceAll('_', ' ')}</Badge>
                            {revision.title && <span className="text-sm font-medium">{revision.title}</span>}
                          </div>
                          <span className="text-xs text-gray-500">{new Date(revision.createdAt).toLocaleString()}</span>
                        </div>
                        {revision.annotation && <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{revision.annotation}</p>}
                        {revision.contextNote && <p className="text-xs text-gray-500 mt-1">Context: {revision.contextNote}</p>}
                        {revision.sensoryNote && <p className="text-xs text-gray-500 mt-1">Sensory: {revision.sensoryNote}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No edits yet. Add the first annotation or enhancement.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h4 className="text-sm font-semibold">Cross-reality porting</h4>
              <p className="text-xs text-gray-500">Move this memory between physical, augmented, virtual, and neural contexts with preserved metadata.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPortEditor((value) => !value)}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              {showPortEditor ? 'Close porting' : 'Port memory'}
            </Button>
          </div>

          {showPortEditor && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source reality</label>
                  <Select value={portForm.sourceReality} onValueChange={(value) => setPortForm((current) => ({ ...current, sourceReality: value as RealityContext }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical</SelectItem>
                      <SelectItem value="augmented">Augmented</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="neural">Neural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target reality</label>
                  <Select value={portForm.targetReality} onValueChange={(value) => setPortForm((current) => ({ ...current, targetReality: value as RealityContext }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical</SelectItem>
                      <SelectItem value="augmented">Augmented</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="neural">Neural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Context note</label>
                <Textarea value={portForm.contextNote} onChange={(e) => setPortForm((current) => ({ ...current, contextNote: e.target.value }))} rows={3} placeholder="Describe how the memory should adapt in the destination reality" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fidelity</label>
                <Input value={portForm.fidelity} onChange={(e) => setPortForm((current) => ({ ...current, fidelity: e.target.value }))} placeholder="full" />
              </div>

              <div className="flex justify-end">
                <Button onClick={handlePortMemory}>
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Port memory now
                </Button>
              </div>
            </div>
          )}

          {ports.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-gray-500" />
                <h5 className="text-sm font-semibold">Port history</h5>
              </div>
              <div className="space-y-2">
                {ports.map((port) => (
                  <div key={port.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{port.sourceReality} to {port.targetReality}</Badge>
                        <span className="text-gray-600 dark:text-gray-300">{port.fidelity} fidelity</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(port.portedAt).toLocaleString()}</span>
                    </div>
                    {port.contextNote && <p className="text-gray-600 dark:text-gray-300 mt-2">{port.contextNote}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
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