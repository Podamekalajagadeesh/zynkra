import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  Heart,
  Loader2,
  Mic,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Users,
  Volume2,
  Wand2,
} from 'lucide-react';
import { useNeuralLiveStreaming, NeuralLiveStreamSignalType, NeuralLiveStreamThoughtType } from '../../hooks/useNeuralLiveStreaming';
import { useUser } from '../../hooks/useUser';
import { useToast } from '../../hooks/useToast';

const THOUGHT_TYPE_LABELS: Record<NeuralLiveStreamThoughtType, string> = {
  observation: 'Observation',
  thought: 'Thought',
  memory: 'Memory',
  'sensory-input': 'Sensory input',
};

const SIGNAL_TYPE_LABELS: Record<NeuralLiveStreamSignalType, string> = {
  reaction: 'Reaction',
  question: 'Question',
  'spotlight-request': 'Spotlight request',
  'sensory-feedback': 'Sensory feedback',
};

const thoughtTypeOptions: Array<{ value: NeuralLiveStreamThoughtType; label: string }> = [
  { value: 'observation', label: 'Observation' },
  { value: 'thought', label: 'Thought' },
  { value: 'memory', label: 'Memory' },
  { value: 'sensory-input', label: 'Sensory input' },
];

const signalTypeOptions: Array<{ value: NeuralLiveStreamSignalType; label: string }> = [
  { value: 'reaction', label: 'Reaction' },
  { value: 'question', label: 'Question' },
  { value: 'spotlight-request', label: 'Spotlight request' },
  { value: 'sensory-feedback', label: 'Sensory feedback' },
];

const initialCreateState = {
  title: 'Neural Aurora Broadcast',
  headline: 'Share the moment as it is happening',
  description: 'A live stream that combines real-time experience, internal narration, and audience participation.',
  currentScene: 'Aurora ridge over a river of light',
  sensoryPaletteText: 'visual, emotional, auditory',
  thoughtPrompt: 'Tell the audience what you are sensing right now.',
  broadcastIntensity: 78,
  maxAudience: 250,
};

const initialThoughtState = {
  type: 'thought' as NeuralLiveStreamThoughtType,
  content: 'The horizon is moving with us, like the scene is breathing back.',
  intensity: 70,
  sensoryTagsText: 'light, motion, awe',
};

const initialSignalState = {
  type: 'reaction' as NeuralLiveStreamSignalType,
  content: 'The audience feels the swell of light and wants to follow the scene deeper.',
  reaction: '✨',
};

const NeuralLiveStreamingStudio: React.FC = () => {
  const {
    sessions,
    currentSession,
    isLoadingSessions,
    isSubmitting,
    sessionError,
    refreshSessions,
    createSession,
    joinSession,
    leaveSession,
    updateBroadcast,
    addThought,
    addAudienceSignal,
    endSession,
    isInSession,
  } = useNeuralLiveStreaming();
  const { user } = useUser();
  const { addToast } = useToast();

  const [createForm, setCreateForm] = useState(initialCreateState);
  const [broadcastForm, setBroadcastForm] = useState(initialCreateState);
  const [thoughtForm, setThoughtForm] = useState(initialThoughtState);
  const [signalForm, setSignalForm] = useState(initialSignalState);

  const currentUser = user?.user;
  const currentUserName = currentUser?.displayName || currentUser?.username || 'You';
  const isHost = currentSession?.hostId === currentUser?.id;
  const liveSessionCount = sessions.filter((session) => session.isLive).length;
  const viewerCount = sessions.reduce((sum, session) => sum + session.participants.length, 0);
  const thoughtCount = sessions.reduce((sum, session) => sum + session.thoughts.length, 0);
  const signalCount = sessions.reduce((sum, session) => sum + session.audienceSignals.length, 0);

  useEffect(() => {
    if (!currentSession) {
      return;
    }

    setBroadcastForm({
      title: currentSession.title,
      headline: currentSession.broadcast.headline,
      description: currentSession.broadcast.description,
      currentScene: currentSession.broadcast.currentScene,
      sensoryPaletteText: currentSession.broadcast.sensoryPalette.join(', '),
      thoughtPrompt: currentSession.broadcast.thoughtPrompt,
      broadcastIntensity: currentSession.broadcast.broadcastIntensity,
      maxAudience: currentSession.maxAudience,
    });
  }, [currentSession]);

  const selectedThoughtTypeLabel = useMemo(() => {
    return thoughtTypeOptions.find((option) => option.value === thoughtForm.type)?.label || '';
  }, [thoughtForm.type]);

  const selectedSignalTypeLabel = useMemo(() => {
    return signalTypeOptions.find((option) => option.value === signalForm.type)?.label || '';
  }, [signalForm.type]);

  const handleCreateSession = () => {
    if (!createForm.title.trim() || !createForm.headline.trim()) {
      addToast({
        type: 'error',
        title: 'Missing details',
        description: 'A title and headline are required to start a neural live stream.',
      });
      return;
    }

    createSession({
      title: createForm.title,
      headline: createForm.headline,
      description: createForm.description,
      currentScene: createForm.currentScene,
      sensoryPalette: createForm.sensoryPaletteText.split(',').map((item) => item.trim()).filter(Boolean),
      thoughtPrompt: createForm.thoughtPrompt,
      broadcastIntensity: createForm.broadcastIntensity,
      maxAudience: createForm.maxAudience,
    });

    addToast({
      type: 'success',
      title: 'Neural live stream created',
      description: 'Your stream is live and ready for audience participation.',
    });
  };

  const handleJoinSession = (sessionId: string) => {
    joinSession(sessionId, 'viewer');
    addToast({
      type: 'success',
      title: 'Joined stream',
      description: 'You are now connected to the neural live broadcast.',
    });
  };

  const handleLeaveSession = () => {
    leaveSession();
    addToast({
      type: 'info',
      title: 'Left stream',
      description: 'You left the live neural broadcast.',
    });
  };

  const handleSaveBroadcast = () => {
    if (!currentSession) {
      return;
    }

    updateBroadcast(currentSession.id, {
      headline: broadcastForm.headline,
      description: broadcastForm.description,
      currentScene: broadcastForm.currentScene,
      sensoryPalette: broadcastForm.sensoryPaletteText.split(',').map((item) => item.trim()).filter(Boolean),
      thoughtPrompt: broadcastForm.thoughtPrompt,
      broadcastIntensity: broadcastForm.broadcastIntensity,
    });

    addToast({
      type: 'success',
      title: 'Broadcast updated',
      description: 'The live neural stream is now reflecting your latest changes.',
    });
  };

  const handleAddThought = () => {
    if (!currentSession || !currentUser) {
      return;
    }

    if (!thoughtForm.content.trim()) {
      addToast({
        type: 'error',
        title: 'Missing thought',
        description: 'Enter a thought before sending it to the stream.',
      });
      return;
    }

    addThought(currentSession.id, {
      userId: currentUser.id,
      displayName: currentUserName,
      type: thoughtForm.type,
      content: thoughtForm.content,
      intensity: thoughtForm.intensity,
      sensoryTags: thoughtForm.sensoryTagsText.split(',').map((item) => item.trim()).filter(Boolean),
    });

    addToast({
      type: 'success',
      title: 'Thought streamed',
      description: 'Your real-time thought has been added to the neural broadcast.',
    });

    setThoughtForm((currentState) => ({
      ...currentState,
      content: '',
    }));
  };

  const handleAddSignal = () => {
    if (!currentSession || !currentUser) {
      return;
    }

    if (!signalForm.content.trim()) {
      addToast({
        type: 'error',
        title: 'Missing audience signal',
        description: 'Enter a reaction, question, or request before sending it.',
      });
      return;
    }

    addAudienceSignal(currentSession.id, {
      userId: currentUser.id,
      displayName: currentUserName,
      type: signalForm.type,
      content: signalForm.content,
      reaction: signalForm.reaction,
    });

    addToast({
      type: 'success',
      title: 'Audience signal sent',
      description: 'The host can respond to your live interaction immediately.',
    });

    setSignalForm((currentState) => ({
      ...currentState,
      content: '',
    }));
  };

  const quickReaction = (emoji: string) => {
    if (!currentSession || !currentUser) {
      return;
    }

    addAudienceSignal(currentSession.id, {
      userId: currentUser.id,
      displayName: currentUserName,
      type: 'reaction',
      content: `Audience reacted with ${emoji}`,
      reaction: emoji,
    });
  };

  const handleEndSession = () => {
    if (!currentSession || !isHost) {
      return;
    }

    endSession(currentSession.id);
    addToast({
      type: 'info',
      title: 'Stream ended',
      description: 'The neural live broadcast has been closed for everyone.',
    });
  };

  if (sessionError) {
    return (
      <Card className="border-red-200 bg-red-50/80 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Neural live streaming unavailable</p>
              <p className="text-sm text-red-700/80">{sessionError}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/50 bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-950 text-white shadow-2xl shadow-fuchsia-950/20">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.35fr_1fr] lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-100">
              <Sparkles className="h-3.5 w-3.5" />
              Neural live streaming
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Broadcast thought, sensation, and presence in real time</h2>
              <p className="max-w-2xl text-sm leading-6 text-fuchsia-50/85 md:text-base">
                Stream a live experience with audience participation, real-time thoughts, and sensory cues. The host controls the broadcast while viewers react, ask questions, and request a spotlight instantly.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-100/70">Live sessions</p>
                <p className="mt-1 text-2xl font-semibold">{liveSessionCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-100/70">Audience</p>
                <p className="mt-1 text-2xl font-semibold">{viewerCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-100/70">Thoughts</p>
                <p className="mt-1 text-2xl font-semibold">{thoughtCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-100/70">Signals</p>
                <p className="mt-1 text-2xl font-semibold">{signalCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-fuchsia-100/70">Current stream</p>
                <h3 className="text-xl font-semibold">{currentSession?.title || 'No active neural stream'}</h3>
              </div>
              <Badge className="bg-fuchsia-400 text-slate-950 hover:bg-fuchsia-300">
                {currentSession ? 'Live' : 'Ready'}
              </Badge>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-fuchsia-300/40">
                  <AvatarImage src={currentUser?.pfp || currentUser?.avatar || currentUser?.profile?.avatarUrl || undefined} alt={currentUserName} />
                  <AvatarFallback>{currentUserName.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-fuchsia-100/70">Hosted by</p>
                  <p className="font-medium">{currentSession?.hostName || currentUserName}</p>
                </div>
              </div>
              <Progress value={currentSession ? currentSession.broadcast.broadcastIntensity : 12} className="h-2 bg-white/10" />
              <p className="text-sm text-fuchsia-50/80">
                {currentSession
                  ? 'The broadcast is live and audience interactions are being synchronized immediately.'
                  : 'Create a new stream or join an existing one to start broadcasting thoughts and sensory inputs.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-fuchsia-600" />
                Create a live neural stream
              </CardTitle>
              <CardDescription>Define the broadcast style, sensory palette, and audience prompt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="neural-title">Title</Label>
                  <Input
                    id="neural-title"
                    value={createForm.title}
                    onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Neural aurora broadcast"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neural-headline">Headline</Label>
                  <Input
                    id="neural-headline"
                    value={createForm.headline}
                    onChange={(event) => setCreateForm((current) => ({ ...current, headline: event.target.value }))}
                    placeholder="Share the moment as it happens"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="neural-description">Description</Label>
                <Textarea
                  id="neural-description"
                  value={createForm.description}
                  onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-[96px]"
                  placeholder="Describe the broadcast style, format, or sensory theme"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="neural-scene">Current scene</Label>
                  <Input
                    id="neural-scene"
                    value={createForm.currentScene}
                    onChange={(event) => setCreateForm((current) => ({ ...current, currentScene: event.target.value }))}
                    placeholder="Aurora ridge over a river of light"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neural-palette">Sensory palette</Label>
                  <Input
                    id="neural-palette"
                    value={createForm.sensoryPaletteText}
                    onChange={(event) => setCreateForm((current) => ({ ...current, sensoryPaletteText: event.target.value }))}
                    placeholder="visual, auditory, emotional"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="neural-prompt">Thought prompt</Label>
                  <Input
                    id="neural-prompt"
                    value={createForm.thoughtPrompt}
                    onChange={(event) => setCreateForm((current) => ({ ...current, thoughtPrompt: event.target.value }))}
                    placeholder="Tell the audience what you sense"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <Label htmlFor="neural-intensity">Broadcast intensity</Label>
                    <span className="font-medium text-dark-500 dark:text-dark-400">{createForm.broadcastIntensity}%</span>
                  </div>
                  <input
                    id="neural-intensity"
                    type="range"
                    min="0"
                    max="100"
                    value={createForm.broadcastIntensity}
                    onChange={(event) => setCreateForm((current) => ({ ...current, broadcastIntensity: Number(event.target.value) }))}
                    className="h-2 w-full cursor-pointer rounded-lg bg-dark-200 accent-fuchsia-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="neural-audience">Audience capacity</Label>
                  <Input
                    id="neural-audience"
                    type="number"
                    min="1"
                    value={createForm.maxAudience}
                    onChange={(event) => setCreateForm((current) => ({ ...current, maxAudience: Number(event.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={handleCreateSession} isLoading={isSubmitting}>
                  <Plus className="h-4 w-4" />
                  Start stream
                </Button>
                <Button variant="secondary" onClick={refreshSessions} isLoading={isLoadingSessions}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh sessions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-fuchsia-600" />
                  Live sessions
                </CardTitle>
                <CardDescription>Join a stream or inspect what is currently broadcasting.</CardDescription>
              </div>
              {isLoadingSessions && <Loader2 className="h-4 w-4 animate-spin text-fuchsia-600" />}
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                  No neural live streams are active yet. Start one to broadcast thoughts and sensory inputs.
                </div>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-dark-700 dark:bg-dark-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold">{session.title}</h3>
                          {session.isLive && <Badge className="bg-emerald-500 text-white">Live</Badge>}
                          <Badge variant="secondary">{session.participants.length}/{session.maxAudience}</Badge>
                        </div>
                        <p className="text-sm text-dark-600 dark:text-dark-300">{session.broadcast.headline}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-dark-500 dark:text-dark-400">
                          <span>Host: {session.hostName}</span>
                          <span>•</span>
                          <span>{session.broadcast.currentScene}</span>
                          <span>•</span>
                          <span>{session.thoughts.length} thoughts</span>
                          <span>•</span>
                          <span>{session.audienceSignals.length} signals</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={currentSession?.id === session.id ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => handleJoinSession(session.id)}
                          disabled={isSubmitting}
                        >
                          {currentSession?.id === session.id ? 'Active' : 'Join'}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-fuchsia-600" />
                Live stream workspace
              </CardTitle>
              <CardDescription>Host the broadcast or participate with thoughts and audience signals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {currentSession ? (
                <>
                  <div className="rounded-2xl border border-dark-200 bg-dark-50/60 p-4 dark:border-dark-700 dark:bg-dark-900/60">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{currentSession.broadcast.currentScene}</p>
                        <p className="text-xs text-dark-500 dark:text-dark-400">{currentSession.broadcast.sensoryPalette.join(' • ')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handleLeaveSession}>
                          <Minus className="h-4 w-4" />
                          Leave
                        </Button>
                        {isHost && (
                          <Button variant="ghost" size="sm" onClick={handleEndSession}>
                            <Pause className="h-4 w-4" />
                            End
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isHost ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="broadcast-headline">Broadcast headline</Label>
                        <Input
                          id="broadcast-headline"
                          value={broadcastForm.headline}
                          onChange={(event) => setBroadcastForm((current) => ({ ...current, headline: event.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="broadcast-description">Description</Label>
                        <Textarea
                          id="broadcast-description"
                          value={broadcastForm.description}
                          onChange={(event) => setBroadcastForm((current) => ({ ...current, description: event.target.value }))}
                          className="min-h-[92px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="broadcast-scene">Current scene</Label>
                        <Input
                          id="broadcast-scene"
                          value={broadcastForm.currentScene}
                          onChange={(event) => setBroadcastForm((current) => ({ ...current, currentScene: event.target.value }))}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="broadcast-palette">Sensory palette</Label>
                          <Input
                            id="broadcast-palette"
                            value={broadcastForm.sensoryPaletteText}
                            onChange={(event) => setBroadcastForm((current) => ({ ...current, sensoryPaletteText: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="broadcast-prompt">Thought prompt</Label>
                          <Input
                            id="broadcast-prompt"
                            value={broadcastForm.thoughtPrompt}
                            onChange={(event) => setBroadcastForm((current) => ({ ...current, thoughtPrompt: event.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <Label htmlFor="broadcast-intensity">Intensity</Label>
                          <span className="font-medium text-dark-500 dark:text-dark-400">{broadcastForm.broadcastIntensity}%</span>
                        </div>
                        <input
                          id="broadcast-intensity"
                          type="range"
                          min="0"
                          max="100"
                          value={broadcastForm.broadcastIntensity}
                          onChange={(event) => setBroadcastForm((current) => ({ ...current, broadcastIntensity: Number(event.target.value) }))}
                          className="h-2 w-full cursor-pointer rounded-lg bg-dark-200 accent-fuchsia-500"
                        />
                      </div>

                      <Button onClick={handleSaveBroadcast} className="w-full">
                        Save broadcast updates
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                      You are connected as a viewer. Use the participation tools below to react or request a spotlight.
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                  Join or create a stream to unlock the live workspace.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-fuchsia-600" />
                Audience participation
              </CardTitle>
              <CardDescription>Viewers can react, ask questions, and request a spotlight instantly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {currentSession ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {['✨', '❤️', '🔥', '🧠'].map((emoji) => (
                      <Button key={emoji} variant="secondary" size="sm" onClick={() => quickReaction(emoji)}>
                        {emoji}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Signal type</Label>
                    <Select
                      value={signalForm.type}
                      onValueChange={(value) => setSignalForm((current) => ({ ...current, type: value as NeuralLiveStreamSignalType }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose signal type" />
                      </SelectTrigger>
                      <SelectContent>
                        {signalTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-dark-500 dark:text-dark-400">Selected: {selectedSignalTypeLabel}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signal-content">Signal content</Label>
                    <Textarea
                      id="signal-content"
                      value={signalForm.content}
                      onChange={(event) => setSignalForm((current) => ({ ...current, content: event.target.value }))}
                      className="min-h-[88px]"
                      placeholder="Ask a question, share a reaction, or request a spotlight"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signal-reaction">Reaction emoji</Label>
                    <Input
                      id="signal-reaction"
                      value={signalForm.reaction}
                      onChange={(event) => setSignalForm((current) => ({ ...current, reaction: event.target.value }))}
                      placeholder="✨"
                    />
                  </div>

                  <Button onClick={handleAddSignal} className="w-full" disabled={!signalForm.content.trim()}>
                    <Send className="h-4 w-4" />
                    Send audience signal
                  </Button>

                  <div className="space-y-3 pt-2">
                    {currentSession.audienceSignals.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                        Audience reactions and questions will appear here.
                      </div>
                    ) : (
                      currentSession.audienceSignals.slice().reverse().map((signal) => (
                        <div key={signal.id} className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-900">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">{signal.displayName}</p>
                              <p className="text-xs text-dark-500 dark:text-dark-400">{SIGNAL_TYPE_LABELS[signal.type]}</p>
                            </div>
                            {signal.reaction ? <Badge variant="secondary">{signal.reaction}</Badge> : <Badge variant="secondary">Live</Badge>}
                          </div>
                          <p className="mt-3 text-sm text-dark-700 dark:text-dark-200">{signal.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                  Join a stream to participate as part of the audience.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-fuchsia-600" />
                Live thought stream
              </CardTitle>
              <CardDescription>Broadcast your real-time thoughts, memories, and sensory inputs to the session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {currentSession ? (
                <>
                  <div className="space-y-2">
                    <Label>Thought type</Label>
                    <Select
                      value={thoughtForm.type}
                      onValueChange={(value) => setThoughtForm((current) => ({ ...current, type: value as NeuralLiveStreamThoughtType }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose thought type" />
                      </SelectTrigger>
                      <SelectContent>
                        {thoughtTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-dark-500 dark:text-dark-400">Selected: {selectedThoughtTypeLabel}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thought-content">Thought content</Label>
                    <Textarea
                      id="thought-content"
                      value={thoughtForm.content}
                      onChange={(event) => setThoughtForm((current) => ({ ...current, content: event.target.value }))}
                      className="min-h-[92px]"
                      placeholder="Describe what you are experiencing right now"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thought-tags">Sensory tags</Label>
                    <Input
                      id="thought-tags"
                      value={thoughtForm.sensoryTagsText}
                      onChange={(event) => setThoughtForm((current) => ({ ...current, sensoryTagsText: event.target.value }))}
                      placeholder="light, motion, awe"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <Label htmlFor="thought-intensity">Intensity</Label>
                      <span className="font-medium text-dark-500 dark:text-dark-400">{thoughtForm.intensity}%</span>
                    </div>
                    <input
                      id="thought-intensity"
                      type="range"
                      min="0"
                      max="100"
                      value={thoughtForm.intensity}
                      onChange={(event) => setThoughtForm((current) => ({ ...current, intensity: Number(event.target.value) }))}
                      className="h-2 w-full cursor-pointer rounded-lg bg-dark-200 accent-fuchsia-500"
                    />
                  </div>

                  <Button onClick={handleAddThought} className="w-full" disabled={!thoughtForm.content.trim()}>
                    <Plus className="h-4 w-4" />
                    Add thought to stream
                  </Button>

                  <div className="space-y-3 pt-2">
                    {currentSession.thoughts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                        Live thoughts will appear here as soon as the host or viewers contribute.
                      </div>
                    ) : (
                      currentSession.thoughts.slice().reverse().map((thought) => (
                        <div key={thought.id} className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-900">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">{thought.displayName}</p>
                              <p className="text-xs text-dark-500 dark:text-dark-400">{THOUGHT_TYPE_LABELS[thought.type]}</p>
                            </div>
                            <Badge variant="secondary">{thought.intensity}%</Badge>
                          </div>
                          <p className="mt-3 text-sm text-dark-700 dark:text-dark-200">{thought.content}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-dark-500 dark:text-dark-400">
                            {thought.sensoryTags.map((tag) => (
                              <span key={tag} className="rounded-full bg-dark-100 px-2 py-1 dark:bg-dark-800">{tag}</span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                  Create or join a stream to broadcast thoughts in real time.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-fuchsia-600" />
                Participants
              </CardTitle>
              <CardDescription>The audience joins the same live stream room immediately.</CardDescription>
            </CardHeader>
            <CardContent>
              {currentSession ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {currentSession.participants.map((participant) => (
                    <div key={participant.userId} className="flex items-center gap-3 rounded-2xl border border-dark-200 bg-white p-3 dark:border-dark-700 dark:bg-dark-900">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{participant.displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{participant.displayName}</p>
                        <p className="text-xs text-dark-500 dark:text-dark-400">
                          {participant.role} • Joined {new Date(participant.joinedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                  No participants are active yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NeuralLiveStreamingStudio;