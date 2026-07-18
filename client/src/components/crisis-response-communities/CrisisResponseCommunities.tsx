import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import api from '../../lib/api';

const CrisisFocus = {
  DISASTER_RELIEF: 'disaster_relief',
  MENTAL_HEALTH_SUPPORT: 'mental_health_support',
  EMERGENCY_AID: 'emergency_aid',
  SHELTER_COORDINATION: 'shelter_coordination',
  RECOVERY_PLANNING: 'recovery_planning',
};

const AidRequestType = {
  FOOD: 'food',
  WATER: 'water',
  SHELTER: 'shelter',
  MEDICAL: 'medical',
  TRANSPORT: 'transport',
  MENTAL_HEALTH: 'mental_health',
  SUPPLIES: 'supplies',
};

const AidRequestStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  FULFILLED: 'fulfilled',
  CLOSED: 'closed',
};

interface CrisisAidRequest {
  id: string;
  communityId: string;
  requesterId?: string;
  requestType: string;
  status: string;
  title: string;
  description: string;
  location?: string;
  resourcesNeeded?: string[];
  contactInfo?: string;
  isUrgent: boolean;
  createdAt: string;
  requester?: { id: string; username?: string; email?: string };
}

interface CrisisResponseCommunity {
  id: string;
  name: string;
  focusAreas: string[];
  description?: string;
  regions?: string[];
  supportChannels?: string[];
  memberCount: number;
  activeAidRequests: number;
  aidRequests?: CrisisAidRequest[];
  creator?: any;
  createdAt: string;
}

interface CrisisResponseCommunityMember {
  id: string;
  communityId: string;
  userId?: string;
  role?: string;
  skillsToOffer?: string[];
  supportPreference?: string[];
  joinedAt: string;
  community?: CrisisResponseCommunity;
}

export const CrisisResponseCommunities: React.FC = () => {
  const [communities, setCommunities] = useState<CrisisResponseCommunity[]>([]);
  const [myMemberships, setMyMemberships] = useState<CrisisResponseCommunityMember[]>([]);
  const [aidRequests, setAidRequests] = useState<CrisisAidRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [aidLoading, setAidLoading] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [selectedRole, setSelectedRole] = useState('coordinator');
  const [joinForm, setJoinForm] = useState({
    skillsToOffer: '',
    supportPreference: '',
  });
  const [requestForm, setRequestForm] = useState({
    title: '',
    requestType: AidRequestType.SUPPLIES,
    description: '',
    location: '',
    resourcesNeeded: '',
    contactInfo: '',
    isUrgent: true,
  });

  const fetchData = async () => {
    try {
      const [commsRes, memsRes] = await Promise.all([
        api.get('/crisis-response-communities'),
        api.get('/crisis-response-communities/user/my-memberships'),
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
    const fetchAidRequests = async () => {
      if (!selectedCommunityId) {
        setAidRequests([]);
        return;
      }

      try {
        setAidLoading(true);
        const response = await api.get(`/crisis-response-communities/${selectedCommunityId}/aid-requests`);
        setAidRequests(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setAidLoading(false);
      }
    };

    fetchAidRequests();
  }, [selectedCommunityId]);

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === selectedCommunityId),
    [communities, selectedCommunityId],
  );

  const isMember = (communityId: string) => myMemberships.some((membership) => membership.communityId === communityId);

  const joinCommunity = async (communityId: string) => {
    try {
      await api.post(`/crisis-response-communities/${communityId}/join`, {
        role: selectedRole,
        skillsToOffer: joinForm.skillsToOffer.split(',').map((item) => item.trim()).filter(Boolean),
        supportPreference: joinForm.supportPreference.split(',').map((item) => item.trim()).filter(Boolean),
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const leaveCommunity = async (communityId: string) => {
    try {
      await api.delete(`/crisis-response-communities/${communityId}/leave`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const createAidRequest = async () => {
    if (!selectedCommunityId || !requestForm.title.trim() || !requestForm.description.trim()) {
      return;
    }

    try {
      await api.post(`/crisis-response-communities/${selectedCommunityId}/aid-requests`, {
        title: requestForm.title,
        requestType: requestForm.requestType,
        description: requestForm.description,
        location: requestForm.location,
        resourcesNeeded: requestForm.resourcesNeeded.split(',').map((item) => item.trim()).filter(Boolean),
        contactInfo: requestForm.contactInfo,
        isUrgent: requestForm.isUrgent,
      });
      setRequestForm({
        title: '',
        requestType: AidRequestType.SUPPLIES,
        description: '',
        location: '',
        resourcesNeeded: '',
        contactInfo: '',
        isUrgent: true,
      });
      await Promise.all([fetchData(), api.get(`/crisis-response-communities/${selectedCommunityId}/aid-requests`).then((response) => setAidRequests(response.data))]);
    } catch (err) {
      console.error(err);
    }
  };

  const updateAidStatus = async (requestId: string, status: string) => {
    try {
      await api.patch(`/crisis-response-communities/${selectedCommunityId}/aid-requests/${requestId}`, { status });
      const response = await api.get(`/crisis-response-communities/${selectedCommunityId}/aid-requests`);
      setAidRequests(response.data);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getFocusBadge = (focus: string) => {
    const colors: Record<string, string> = {
      [CrisisFocus.DISASTER_RELIEF]: 'bg-red-100 text-red-800',
      [CrisisFocus.MENTAL_HEALTH_SUPPORT]: 'bg-violet-100 text-violet-800',
      [CrisisFocus.EMERGENCY_AID]: 'bg-amber-100 text-amber-800',
      [CrisisFocus.SHELTER_COORDINATION]: 'bg-blue-100 text-blue-800',
      [CrisisFocus.RECOVERY_PLANNING]: 'bg-emerald-100 text-emerald-800',
    };
    return colors[focus] || 'bg-gray-100 text-gray-800';
  };

  const getRequestBadge = (status: string) => {
    const colors: Record<string, string> = {
      [AidRequestStatus.OPEN]: 'bg-red-100 text-red-800',
      [AidRequestStatus.IN_PROGRESS]: 'bg-amber-100 text-amber-800',
      [AidRequestStatus.FULFILLED]: 'bg-emerald-100 text-emerald-800',
      [AidRequestStatus.CLOSED]: 'bg-slate-100 text-slate-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading crisis response communities...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Crisis Response Communities</h2>
        <p className="text-gray-500 mt-2">
          Global networks for disaster relief, mental health support, and emergency aid coordination
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Create or update an aid request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Community</Label>
            <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a community" />
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
            <Label>Title</Label>
            <Input
              value={requestForm.title}
              onChange={(event) => setRequestForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Need bottled water for shelter"
            />
          </div>
          <div className="space-y-2">
            <Label>Request type</Label>
            <Select
              value={requestForm.requestType}
              onValueChange={(value) => setRequestForm((current) => ({ ...current, requestType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AidRequestType).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {key.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Description</Label>
            <Textarea
              value={requestForm.description}
              onChange={(event) => setRequestForm((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              placeholder="Describe the relief need in detail"
            />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={requestForm.location}
              onChange={(event) => setRequestForm((current) => ({ ...current, location: event.target.value }))}
              placeholder="Community shelter, district, or city"
            />
          </div>
          <div className="space-y-2">
            <Label>Resources needed</Label>
            <Input
              value={requestForm.resourcesNeeded}
              onChange={(event) => setRequestForm((current) => ({ ...current, resourcesNeeded: event.target.value }))}
              placeholder="water, blankets, chargers"
            />
          </div>
          <div className="space-y-2">
            <Label>Contact info</Label>
            <Input
              value={requestForm.contactInfo}
              onChange={(event) => setRequestForm((current) => ({ ...current, contactInfo: event.target.value }))}
              placeholder="Safe phone number or messaging handle"
            />
          </div>
          <div className="space-y-2">
            <Label>Urgency</Label>
            <Select
              value={requestForm.isUrgent ? 'urgent' : 'standard'}
              onValueChange={(value) => setRequestForm((current) => ({ ...current, isUrgent: value === 'urgent' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={createAidRequest} disabled={!isMember(selectedCommunityId)}>
              Publish aid request
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Join as a responder</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Your role</Label>
            <Input value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)} placeholder="coordinator, volunteer, counselor" />
          </div>
          <div className="space-y-2">
            <Label>Skills you offer</Label>
            <Input
              value={joinForm.skillsToOffer}
              onChange={(event) => setJoinForm((current) => ({ ...current, skillsToOffer: event.target.value }))}
              placeholder="first aid, translation, logistics"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Support preference</Label>
            <Input
              value={joinForm.supportPreference}
              onChange={(event) => setJoinForm((current) => ({ ...current, supportPreference: event.target.value }))}
              placeholder="field support, remote triage, logistics"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 mb-6">
        {communities.map((community) => (
          <Card key={community.id}>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-lg">{community.name}</CardTitle>
                  {community.description && <p className="text-sm text-gray-500 mt-1">{community.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {community.focusAreas.map((focus) => (
                    <Badge key={focus} className={getFocusBadge(focus)}>
                      {focus.replaceAll('_', ' ')}
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
                  <p className="text-xs uppercase text-gray-500">Open aid requests</p>
                  <p className="text-xl font-semibold">{community.activeAidRequests}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs uppercase text-gray-500">Regions</p>
                  <p className="text-sm font-medium">{(community.regions ?? []).join(', ') || 'Global'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Support channels</h4>
                <div className="flex flex-wrap gap-2">
                  {(community.supportChannels ?? []).map((channel) => (
                    <Badge key={channel} className="bg-slate-100 text-slate-800">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between flex-wrap">
                <p className="text-sm text-gray-500">Emergency aid coordination is active here</p>
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
            <CardTitle className="text-lg">Live aid requests in {selectedCommunity.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aidLoading && <p className="text-sm text-gray-500">Loading aid requests...</p>}
            {!aidLoading && aidRequests.map((request) => (
              <div key={request.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-sm">{request.title}</p>
                  <div className="flex gap-2">
                    <Badge className={request.isUrgent ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}>
                      {request.isUrgent ? 'urgent' : 'standard'}
                    </Badge>
                    <Badge className={getRequestBadge(request.status)}>{request.status}</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{request.description}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>Type: {request.requestType}</span>
                  {request.location && <span>Location: {request.location}</span>}
                  {request.requester?.username && <span>Posted by: {request.requester.username}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateAidStatus(request.id, AidRequestStatus.IN_PROGRESS)}>Take</Button>
                  <Button size="sm" variant="outline" onClick={() => updateAidStatus(request.id, AidRequestStatus.FULFILLED)}>Fulfill</Button>
                  <Button size="sm" variant="outline" onClick={() => updateAidStatus(request.id, AidRequestStatus.CLOSED)}>Close</Button>
                </div>
              </div>
            ))}
            {!aidLoading && aidRequests.length === 0 && (
              <p className="text-sm text-gray-500">No open aid requests yet. Create the first response request for this community.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};