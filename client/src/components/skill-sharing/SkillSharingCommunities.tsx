import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import api from '../../lib/api';

interface ImmersiveLearningSession {
  title: string;
  summary: string;
  durationMinutes: number;
  steps: string[];
  takeaway: string;
}

interface SkillCommunity {
  id: string;
  name: string;
  description?: string;
  skills?: string[];
  memberCount: number;
  exchangeCount: number;
  creator?: any;
  createdAt: string;
}

interface SkillCommunityMember {
  id: string;
  communityId: string;
  userId: string;
  offeringSkills?: string[];
  seekingSkills?: string[];
  joinedAt: string;
  community?: SkillCommunity;
}

interface SkillExchange {
  id: string;
  communityId: string;
  requesterId: string;
  providerId?: string;
  offeredSkill?: string;
  requestedSkill?: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  requester?: any;
  provider?: any;
}

const LearningMode = {
  LIVE_PRACTICE: 'live_practice',
  GUIDED_SESSION: 'guided_session',
  NEURAL_RECAP: 'neural_recap',
  PROJECT_SWAP: 'project_swap',
};

export const SkillSharingCommunities: React.FC = () => {
  const [communities, setCommunities] = useState<SkillCommunity[]>([]);
  const [myMemberships, setMyMemberships] = useState<SkillCommunityMember[]>([]);
  const [exchanges, setExchanges] = useState<SkillExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangesLoading, setExchangesLoading] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [selectedMode, setSelectedMode] = useState(LearningMode.LIVE_PRACTICE);
  const [joinForm, setJoinForm] = useState({
    offeringSkills: '',
    seekingSkills: '',
  });
  const [learningForm, setLearningForm] = useState({
    title: '',
    topic: '',
    skill: '',
    durationMinutes: '20',
    steps: '',
  });
  const [immersiveSession, setImmersiveSession] = useState<ImmersiveLearningSession | null>(null);
  const [exchangeForm, setExchangeForm] = useState({
    offeredSkill: '',
    requestedSkill: '',
    description: '',
  });

  const fetchData = async () => {
    try {
      const [commsRes, memsRes] = await Promise.all([
        api.get('/skill-sharing'),
        api.get('/skill-sharing/user/my-memberships'),
      ]);
      setCommunities(commsRes.data);
      setMyMemberships(memsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedCommunityId && communities.length > 0) {
      setSelectedCommunityId(communities[0].id);
    }
  }, [communities, selectedCommunityId]);

  useEffect(() => {
    const fetchExchanges = async () => {
      if (!selectedCommunityId) {
        setExchanges([]);
        return;
      }

      try {
        setExchangesLoading(true);
        const response = await api.get(`/skill-sharing/${selectedCommunityId}/exchanges`);
        setExchanges(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setExchangesLoading(false);
      }
    };

    fetchExchanges();
  }, [selectedCommunityId]);

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === selectedCommunityId),
    [communities, selectedCommunityId],
  );

  const isMember = (communityId: string) => myMemberships.some((membership) => membership.communityId === communityId);

  const joinCommunity = async (communityId: string) => {
    try {
      await api.post(`/skill-sharing/${communityId}/join`, {
        offeringSkills: joinForm.offeringSkills.split(',').map((skill) => skill.trim()).filter(Boolean),
        seekingSkills: joinForm.seekingSkills.split(',').map((skill) => skill.trim()).filter(Boolean),
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const leaveCommunity = async (communityId: string) => {
    try {
      await api.delete(`/skill-sharing/${communityId}/leave`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const createImmersiveSession = async () => {
    try {
      const response = await api.post('/skill-sharing/immersive-learning', {
        title: learningForm.title || 'Immersive learning session',
        topic: learningForm.topic || 'a new skill',
        skill: learningForm.skill || 'the craft',
        durationMinutes: Number(learningForm.durationMinutes) || 20,
        steps: learningForm.steps.split(',').map((step) => step.trim()).filter(Boolean),
      });
      setImmersiveSession(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createExchange = async () => {
    if (!selectedCommunityId || !exchangeForm.offeredSkill.trim() || !exchangeForm.requestedSkill.trim()) {
      return;
    }

    try {
      await api.post(`/skill-sharing/${selectedCommunityId}/exchanges`, {
        offeredSkill: exchangeForm.offeredSkill,
        requestedSkill: exchangeForm.requestedSkill,
        description: `${exchangeForm.description}\nLearning mode: ${selectedMode}`,
      });
      setExchangeForm({ offeredSkill: '', requestedSkill: '', description: '' });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getSkillBadge = (skill: string) => {
    const colors: Record<string, string> = {
      JavaScript: 'bg-yellow-100 text-yellow-800',
      Python: 'bg-blue-100 text-blue-800',
      Design: 'bg-pink-100 text-pink-800',
      Writing: 'bg-emerald-100 text-emerald-800',
      Cooking: 'bg-orange-100 text-orange-800',
      Gardening: 'bg-green-100 text-green-800',
      DIY: 'bg-slate-100 text-slate-800',
      Carpentry: 'bg-amber-100 text-amber-800',
    };
    return colors[skill] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading skill-sharing communities...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Skill-Sharing Collective Communities</h2>
        <p className="text-gray-500 mt-2">
          Users trade skills and knowledge directly through practical exchanges, guided sessions, and peer learning
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Immersive learning experiences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Session title</Label>
            <Input value={learningForm.title} onChange={(event) => setLearningForm((current) => ({ ...current, title: event.target.value }))} placeholder="Neural pottery basics" />
          </div>
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input value={learningForm.topic} onChange={(event) => setLearningForm((current) => ({ ...current, topic: event.target.value }))} placeholder="Pottery, cooking, guitar" />
          </div>
          <div className="space-y-2">
            <Label>Skill focus</Label>
            <Input value={learningForm.skill} onChange={(event) => setLearningForm((current) => ({ ...current, skill: event.target.value }))} placeholder="Throwing clay, kneading dough" />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={learningForm.durationMinutes} onChange={(event) => setLearningForm((current) => ({ ...current, durationMinutes: event.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Guide steps</Label>
            <Input value={learningForm.steps} onChange={(event) => setLearningForm((current) => ({ ...current, steps: event.target.value }))} placeholder="Warm-up, observe, practice, reflect" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={createImmersiveSession}>Generate immersive lesson</Button>
          </div>
          {immersiveSession && (
            <div className="md:col-span-2 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <p className="font-semibold">{immersiveSession.title}</p>
              <p className="text-sm text-gray-700 mt-1">{immersiveSession.summary}</p>
              <p className="text-sm text-gray-600 mt-2">Duration: {immersiveSession.durationMinutes} minutes</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                {immersiveSession.steps.map((step) => <li key={step}>{step}</li>)}
              </ul>
              <p className="text-sm text-gray-700 mt-2">{immersiveSession.takeaway}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Create a learning exchange</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Choose community</Label>
            <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a skill-sharing community" />
              </SelectTrigger>
              <SelectContent>
                {communities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Offered skill</Label>
            <Input value={exchangeForm.offeredSkill} onChange={(event) => setExchangeForm((current) => ({ ...current, offeredSkill: event.target.value }))} placeholder="Editing, pottery, algebra tutoring" />
          </div>
          <div className="space-y-2">
            <Label>Requested skill</Label>
            <Input value={exchangeForm.requestedSkill} onChange={(event) => setExchangeForm((current) => ({ ...current, requestedSkill: event.target.value }))} placeholder="Video editing, French, guitar" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Learning mode</Label>
            <Select value={selectedMode} onValueChange={setSelectedMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LearningMode).map(([key, value]) => (
                  <SelectItem key={key} value={value}>{key.replaceAll('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Exchange notes</Label>
            <Textarea
              value={exchangeForm.description}
              onChange={(event) => setExchangeForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Describe the outcome you want from the learning exchange"
              rows={4}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={createExchange} disabled={!isMember(selectedCommunityId)}>
              Request exchange
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 mb-6">
        <Card className="mb-2">
          <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Skills you offer on join</Label>
              <Input
                value={joinForm.offeringSkills}
                onChange={(event) => setJoinForm((current) => ({ ...current, offeringSkills: event.target.value }))}
                placeholder="JavaScript, drawing, sewing"
              />
            </div>
            <div className="space-y-2">
              <Label>Skills you want to learn</Label>
              <Input
                value={joinForm.seekingSkills}
                onChange={(event) => setJoinForm((current) => ({ ...current, seekingSkills: event.target.value }))}
                placeholder="Spanish, home repair, public speaking"
              />
            </div>
          </CardContent>
        </Card>

        {communities.map((community) => (
          <Card key={community.id}>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-lg">{community.name}</CardTitle>
                  {community.description && <p className="text-sm text-gray-500 mt-1">{community.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(community.skills ?? []).map((skill) => (
                    <Badge key={skill} className={getSkillBadge(skill)}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs uppercase text-gray-500">Members</p>
                  <p className="text-xl font-semibold">{community.memberCount}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs uppercase text-gray-500">Exchanges</p>
                  <p className="text-xl font-semibold">{community.exchangeCount}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs uppercase text-gray-500">Mode</p>
                  <p className="text-sm font-medium">Peer learning and hands-on practice</p>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between flex-wrap">
                <p className="text-sm text-gray-500">Current exchange hub for mutual skill growth</p>
                {isMember(community.id) ? (
                  <Button variant="destructive" onClick={() => leaveCommunity(community.id)}>
                    Leave
                  </Button>
                ) : (
                  <Button onClick={() => joinCommunity(community.id)}>Join Community</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCommunity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live exchanges in {selectedCommunity.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exchangesLoading && <p className="text-sm text-gray-500">Loading live exchange board...</p>}
              {!exchangesLoading && exchanges.map((exchange) => (
                <div key={exchange.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-sm">
                      {exchange.offeredSkill || 'Skill'} for {exchange.requestedSkill || 'skill'}
                    </p>
                    <Badge className={exchange.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                      {exchange.completed ? 'completed' : 'open'}
                    </Badge>
                  </div>
                  {exchange.description && <p className="text-sm text-gray-600 mt-2">{exchange.description}</p>}
                </div>
              ))}
              {!exchangesLoading && exchanges.length === 0 && (
                <p className="text-sm text-gray-500">
                  No exchanges yet. Start one to trade skills through live peer learning.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};