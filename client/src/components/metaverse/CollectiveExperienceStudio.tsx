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
  Globe2,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';
import { useCollectiveExperience, CollectiveExperienceContributionType, CollectiveExperienceTheme } from '../../hooks/useCollectiveExperience';
import { useUser } from '../../hooks/useUser';
import { useToast } from '../../hooks/useToast';

const THEME_LABELS: Record<CollectiveExperienceTheme, string> = {
  'virtual-trip': 'Virtual Trip',
  event: 'Event',
  story: 'Story',
};

const CONTRIBUTION_LABELS: Record<CollectiveExperienceContributionType, string> = {
  'travel-note': 'Travel note',
  'event-step': 'Event step',
  'story-beat': 'Story beat',
  'sensory-cue': 'Sensory cue',
};

const themeOptions: Array<{ value: CollectiveExperienceTheme; label: string; description: string }> = [
  { value: 'virtual-trip', label: 'Virtual Trip', description: 'Co-create a shared journey and destination' },
  { value: 'event', label: 'Event', description: 'Build a live shared gathering together' },
  { value: 'story', label: 'Story', description: 'Write an immersive story in real time' },
];

const contributionOptions: Array<{ value: CollectiveExperienceContributionType; label: string }> = [
  { value: 'travel-note', label: 'Travel note' },
  { value: 'event-step', label: 'Event step' },
  { value: 'story-beat', label: 'Story beat' },
  { value: 'sensory-cue', label: 'Sensory cue' },
];

const initialCreateState = {
  title: 'Neural Aurora Expedition',
  theme: 'virtual-trip' as CollectiveExperienceTheme,
  prompt: 'Map a luminous shared journey through a sky made of moving color and memory.',
  location: 'Aurora Ridge',
  sensoryMood: 'Euphoric, collaborative, and luminous',
};

const initialContributionState = {
  type: 'sensory-cue' as CollectiveExperienceContributionType,
  text: 'The air brightens as our path opens into a sweeping ribbon of light.',
  intensity: 72,
};

const CollectiveExperienceStudio: React.FC = () => {
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
    updateScene,
    addContribution,
    isInSession,
  } = useCollectiveExperience();
  const { user } = useUser();
  const { addToast } = useToast();

  const [createForm, setCreateForm] = useState(initialCreateState);
  const [sceneForm, setSceneForm] = useState(initialCreateState);
  const [highlightInput, setHighlightInput] = useState('shared horizon, synchronized motion, vivid atmosphere');
  const [contributionForm, setContributionForm] = useState(initialContributionState);

  const currentUser = user?.user;
  const currentUserName = currentUser?.displayName || currentUser?.username || 'You';
  const sessionParticipants = currentSession?.participants.length ?? 0;
  const sessionContributions = currentSession?.contributions.length ?? 0;
  const liveSessionCount = sessions.filter((session) => session.isLive).length;

  useEffect(() => {
    if (!currentSession) {
      return;
    }

    setSceneForm({
      title: currentSession.title,
      theme: currentSession.theme,
      prompt: currentSession.scene.prompt,
      location: currentSession.scene.location,
      sensoryMood: currentSession.scene.sensoryMood,
    });
    setHighlightInput(currentSession.scene.highlights.join(', '));
  }, [currentSession]);

  const selectedThemeDescription = useMemo(() => {
    return themeOptions.find((theme) => theme.value === createForm.theme)?.description ?? '';
  }, [createForm.theme]);

  const handleCreateSession = () => {
    if (!createForm.title.trim() || !createForm.prompt.trim()) {
      addToast({
        type: 'error',
        title: 'Missing details',
        description: 'A title and prompt are required to create a collective experience.',
      });
      return;
    }

    createSession(createForm);
    addToast({
      type: 'success',
      title: 'Collective experience created',
      description: 'Your session is now live and ready for collaborators.',
    });
  };

  const handleJoinSession = (sessionId: string) => {
    joinSession(sessionId);
    addToast({
      type: 'success',
      title: 'Joined session',
      description: 'You are now inside the shared experience.',
    });
  };

  const handleLeaveSession = () => {
    leaveSession();
    addToast({
      type: 'info',
      title: 'Left session',
      description: 'You left the collective experience session.',
    });
  };

  const handleSaveScene = () => {
    if (!currentSession) {
      return;
    }

    updateScene(currentSession.id, {
      prompt: sceneForm.prompt,
      location: sceneForm.location,
      sensoryMood: sceneForm.sensoryMood,
      highlights: highlightInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });

    addToast({
      type: 'success',
      title: 'Scene updated',
      description: 'The shared experience scene now reflects your changes.',
    });
  };

  const handleAddContribution = () => {
    if (!currentSession || !currentUser) {
      return;
    }

    if (!contributionForm.text.trim()) {
      addToast({
        type: 'error',
        title: 'Missing contribution',
        description: 'Add a contribution note before sending it to the group.',
      });
      return;
    }

    addContribution(currentSession.id, {
      userId: currentUser.id,
      displayName: currentUserName,
      type: contributionForm.type,
      text: contributionForm.text,
      intensity: contributionForm.intensity,
    });

    addToast({
      type: 'success',
      title: 'Contribution added',
      description: 'Your real-time idea has been shared with the group.',
    });

    setContributionForm((currentState) => ({
      ...currentState,
      text: '',
    }));
  };

  if (sessionError) {
    return (
      <Card className="border-red-200 bg-red-50/80 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Collective experience unavailable</p>
              <p className="text-sm text-red-700/80">{sessionError}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/50 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-900 text-white shadow-2xl shadow-cyan-950/20">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr] lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Neural collaboration
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Collective experience creation</h2>
              <p className="max-w-2xl text-sm leading-6 text-cyan-50/85 md:text-base">
                Groups can co-create immersive virtual trips, events, and stories in real time. Sessions stay live through the socket layer, so every scene edit and contribution is shared immediately.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">Live sessions</p>
                <p className="mt-1 text-2xl font-semibold">{liveSessionCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">Participants</p>
                <p className="mt-1 text-2xl font-semibold">{sessionParticipants}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">Contributions</p>
                <p className="mt-1 text-2xl font-semibold">{sessionContributions}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">Connection</p>
                <p className="mt-1 text-2xl font-semibold">{isInSession ? 'Live' : 'Idle'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-cyan-100/70">Current experience</p>
                <h3 className="text-xl font-semibold">{currentSession?.title || 'No active session'}</h3>
              </div>
              <Badge className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                {currentSession ? THEME_LABELS[currentSession.theme] : 'Ready'}
              </Badge>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-cyan-300/40">
                  <AvatarImage src={currentUser?.pfp || currentUser?.avatar || currentUser?.profile?.avatarUrl || undefined} alt={currentUserName} />
                  <AvatarFallback>{currentUserName.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-cyan-100/70">Hosted by</p>
                  <p className="font-medium">{currentSession?.hostName || currentUserName}</p>
                </div>
              </div>
              <Progress value={currentSession ? 100 : 12} className="h-2 bg-white/10" />
              <p className="text-sm text-cyan-50/80">
                {currentSession
                  ? 'The collaborative scene is active and ready for live edits.'
                  : 'Create a new session or join an existing one to begin co-authoring the experience.'}
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
                <Wand2 className="h-5 w-5 text-cyan-600" />
                Create a new experience
              </CardTitle>
              <CardDescription>{selectedThemeDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="collective-title">Title</Label>
                  <Input
                    id="collective-title"
                    value={createForm.title}
                    onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Shared aurora expedition"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={createForm.theme}
                    onValueChange={(value) => setCreateForm((current) => ({ ...current, theme: value as CollectiveExperienceTheme }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {themeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div>{option.label}</div>
                            <div className="text-xs text-dark-500 dark:text-dark-400">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="collective-prompt">Prompt</Label>
                <Textarea
                  id="collective-prompt"
                  value={createForm.prompt}
                  onChange={(event) => setCreateForm((current) => ({ ...current, prompt: event.target.value }))}
                  placeholder="Describe the experience you want the group to build together"
                  className="min-h-[110px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="collective-location">Location</Label>
                  <Input
                    id="collective-location"
                    value={createForm.location}
                    onChange={(event) => setCreateForm((current) => ({ ...current, location: event.target.value }))}
                    placeholder="Aurora Ridge"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collective-mood">Sensory mood</Label>
                  <Input
                    id="collective-mood"
                    value={createForm.sensoryMood}
                    onChange={(event) => setCreateForm((current) => ({ ...current, sensoryMood: event.target.value }))}
                    placeholder="Curious, collaborative, and immersive"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={handleCreateSession} isLoading={isSubmitting}>
                  <Plus className="h-4 w-4" />
                  Create session
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
                  <Globe2 className="h-5 w-5 text-cyan-600" />
                  Available sessions
                </CardTitle>
                <CardDescription>Join a live room or inspect a session before entering.</CardDescription>
              </div>
              {isLoadingSessions && <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />}
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                  No live sessions yet. Create one to start a shared experience.
                </div>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-dark-700 dark:bg-dark-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold">{session.title}</h3>
                          <Badge variant="secondary">{THEME_LABELS[session.theme]}</Badge>
                          {session.isLive && <Badge className="bg-emerald-500 text-white">Live</Badge>}
                        </div>
                        <p className="text-sm text-dark-600 dark:text-dark-300">{session.scene.prompt}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-dark-500 dark:text-dark-400">
                          <span>Host: {session.hostName}</span>
                          <span>•</span>
                          <span>{session.participants.length} collaborators</span>
                          <span>•</span>
                          <span>{session.contributions.length} contributions</span>
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
                <Users className="h-5 w-5 text-cyan-600" />
                Live session workspace
              </CardTitle>
              <CardDescription>Adjust the shared scene and stream new ideas into the room.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {currentSession ? (
                <>
                  <div className="rounded-2xl border border-dark-200 bg-dark-50/60 p-4 dark:border-dark-700 dark:bg-dark-900/60">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{currentSession.scene.location}</p>
                        <p className="text-xs text-dark-500 dark:text-dark-400">{currentSession.scene.sensoryMood}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleLeaveSession}>
                        <Minus className="h-4 w-4" />
                        Leave
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="scene-prompt">Scene prompt</Label>
                    <Textarea
                      id="scene-prompt"
                      value={sceneForm.prompt}
                      onChange={(event) => setSceneForm((current) => ({ ...current, prompt: event.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="scene-location">Location</Label>
                      <Input
                        id="scene-location"
                        value={sceneForm.location}
                        onChange={(event) => setSceneForm((current) => ({ ...current, location: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scene-mood">Sensory mood</Label>
                      <Input
                        id="scene-mood"
                        value={sceneForm.sensoryMood}
                        onChange={(event) => setSceneForm((current) => ({ ...current, sensoryMood: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scene-highlights">Scene highlights</Label>
                    <Input
                      id="scene-highlights"
                      value={highlightInput}
                      onChange={(event) => setHighlightInput(event.target.value)}
                      placeholder="Comma-separated highlights"
                    />
                  </div>

                  <Button onClick={handleSaveScene} className="w-full">
                    Save live scene
                  </Button>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                  Join or create a session to unlock the shared workspace.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-600" />
                Participants
              </CardTitle>
              <CardDescription>Everyone in the room receives updates immediately.</CardDescription>
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
                        <p className="text-xs text-dark-500 dark:text-dark-400">Joined {new Date(participant.joinedAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                  No active participants yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-600" />
                Real-time contribution stream
              </CardTitle>
              <CardDescription>Every contribution becomes part of the shared experience log.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {currentSession ? (
                <>
                  <div className="space-y-2">
                    <Label>Contribution type</Label>
                    <Select
                      value={contributionForm.type}
                      onValueChange={(value) => setContributionForm((current) => ({ ...current, type: value as CollectiveExperienceContributionType }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose contribution type" />
                      </SelectTrigger>
                      <SelectContent>
                        {contributionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contribution-text">Contribution text</Label>
                    <Textarea
                      id="contribution-text"
                      value={contributionForm.text}
                      onChange={(event) => setContributionForm((current) => ({ ...current, text: event.target.value }))}
                      className="min-h-[96px]"
                      placeholder="Share a sensory cue, story beat, or event step"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <Label htmlFor="contribution-intensity">Intensity</Label>
                      <span className="font-medium text-dark-500 dark:text-dark-400">{contributionForm.intensity}%</span>
                    </div>
                    <input
                      id="contribution-intensity"
                      type="range"
                      min="0"
                      max="100"
                      value={contributionForm.intensity}
                      onChange={(event) => setContributionForm((current) => ({ ...current, intensity: Number(event.target.value) }))}
                      className="h-2 w-full cursor-pointer rounded-lg bg-dark-200 accent-primary-500"
                    />
                  </div>

                  <Button onClick={handleAddContribution} className="w-full" disabled={!contributionForm.text.trim()}>
                    <Plus className="h-4 w-4" />
                    Add contribution
                  </Button>

                  <div className="space-y-3 pt-2">
                    {currentSession.contributions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                        Contributions will appear here as soon as collaborators start adding them.
                      </div>
                    ) : (
                      currentSession.contributions.slice().reverse().map((contribution) => (
                        <div key={contribution.id} className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-900">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">{contribution.displayName}</p>
                              <p className="text-xs text-dark-500 dark:text-dark-400">{CONTRIBUTION_LABELS[contribution.type]}</p>
                            </div>
                            <Badge variant="secondary">{contribution.intensity}%</Badge>
                          </div>
                          <p className="mt-3 text-sm text-dark-700 dark:text-dark-200">{contribution.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/60 p-5 text-sm text-dark-500 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-400">
                  Contributions are unlocked once you join an active session.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CollectiveExperienceStudio;