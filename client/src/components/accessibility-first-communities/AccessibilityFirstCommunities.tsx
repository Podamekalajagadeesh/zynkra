import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import api from '../../lib/api';

const AccessibilityNeedType = {
  PHYSICAL: 'physical',
  COGNITIVE: 'cognitive',
  VISUAL: 'visual',
  HEARING: 'hearing',
  SPEECH: 'speech',
  SENSORY: 'sensory',
};

const InterfacePreset = {
  LOW_STIMULUS: 'low_stimulus',
  HIGH_CONTRAST: 'high_contrast',
  LARGE_TEXT: 'large_text',
  SLOW_ANIMATIONS: 'slow_animations',
  SCREEN_READER_FIRST: 'screen_reader_first',
  KEYBOARD_NAV_ONLY: 'keyboard_nav_only',
  CUSTOM: 'custom',
};

const AccommodationRequestStatus = {
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  READY: 'ready',
  FULFILLED: 'fulfilled',
};

interface AccessibilityAccommodationRequest {
  id: string;
  communityId: string;
  requesterId?: string;
  needType: string;
  status: string;
  title: string;
  description: string;
  requestedAdjustments?: string[];
  interfaceSettings?: Record<string, any>;
  isUrgent: boolean;
  createdAt: string;
  requester?: { id: string; username?: string; email?: string };
}

interface AccessibilityFirstCommunity {
  id: string;
  name: string;
  supportedNeeds: string[];
  description?: string;
  interfaceProfiles?: string[];
  accessibilityFeatures?: string[];
  customInterfaceTemplates?: string[];
  memberCount: number;
  activeRequests: number;
  accommodationRequests?: AccessibilityAccommodationRequest[];
  creator?: any;
  createdAt: string;
}

interface AccessibilityCommunityMember {
  id: string;
  communityId: string;
  userId?: string;
  role?: string;
  accessibilityNeeds?: string[];
  preferredPreset?: string;
  customSettings?: Record<string, any>;
  joinedAt: string;
  community?: AccessibilityFirstCommunity;
}

export const AccessibilityFirstCommunities: React.FC = () => {
  const [communities, setCommunities] = useState<AccessibilityFirstCommunity[]>([]);
  const [myMemberships, setMyMemberships] = useState<AccessibilityCommunityMember[]>([]);
  const [requests, setRequests] = useState<AccessibilityAccommodationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(InterfacePreset.CUSTOM);
  const [joinForm, setJoinForm] = useState({
    role: 'member',
    accessibilityNeeds: '',
    customSettings: '',
  });
  const [requestForm, setRequestForm] = useState({
    title: '',
    needType: AccessibilityNeedType.COGNITIVE,
    description: '',
    requestedAdjustments: '',
    interfaceSettings: '',
    isUrgent: false,
  });

  const fetchData = async () => {
    try {
      const [commsRes, memsRes] = await Promise.all([
        api.get('/accessibility-first-communities'),
        api.get('/accessibility-first-communities/user/my-memberships'),
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
    const fetchRequests = async () => {
      if (!selectedCommunityId) {
        setRequests([]);
        return;
      }

      try {
        setRequestsLoading(true);
        const response = await api.get(`/accessibility-first-communities/${selectedCommunityId}/accommodations`);
        setRequests(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchRequests();
  }, [selectedCommunityId]);

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === selectedCommunityId),
    [communities, selectedCommunityId],
  );

  const isMember = (communityId: string) => myMemberships.some((membership) => membership.communityId === communityId);

  const joinCommunity = async (communityId: string) => {
    try {
      await api.post(`/accessibility-first-communities/${communityId}/join`, {
        role: joinForm.role,
        accessibilityNeeds: joinForm.accessibilityNeeds.split(',').map((item) => item.trim()).filter(Boolean),
        preferredPreset: selectedPreset,
        customSettings: joinForm.customSettings ? JSON.parse(joinForm.customSettings) : {},
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const leaveCommunity = async (communityId: string) => {
    try {
      await api.delete(`/accessibility-first-communities/${communityId}/leave`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const createRequest = async () => {
    if (!selectedCommunityId || !requestForm.title.trim() || !requestForm.description.trim()) {
      return;
    }

    try {
      await api.post(`/accessibility-first-communities/${selectedCommunityId}/accommodations`, {
        title: requestForm.title,
        needType: requestForm.needType,
        description: requestForm.description,
        requestedAdjustments: requestForm.requestedAdjustments.split(',').map((item) => item.trim()).filter(Boolean),
        interfaceSettings: requestForm.interfaceSettings ? JSON.parse(requestForm.interfaceSettings) : {},
        isUrgent: requestForm.isUrgent,
      });
      setRequestForm({
        title: '',
        needType: AccessibilityNeedType.COGNITIVE,
        description: '',
        requestedAdjustments: '',
        interfaceSettings: '',
        isUrgent: false,
      });
      const response = await api.get(`/accessibility-first-communities/${selectedCommunityId}/accommodations`);
      setRequests(response.data);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      await api.patch(`/accessibility-first-communities/${selectedCommunityId}/accommodations/${requestId}`, { status });
      const response = await api.get(`/accessibility-first-communities/${selectedCommunityId}/accommodations`);
      setRequests(response.data);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getNeedBadge = (need: string) => {
    const colors: Record<string, string> = {
      [AccessibilityNeedType.PHYSICAL]: 'bg-blue-100 text-blue-800',
      [AccessibilityNeedType.COGNITIVE]: 'bg-violet-100 text-violet-800',
      [AccessibilityNeedType.VISUAL]: 'bg-emerald-100 text-emerald-800',
      [AccessibilityNeedType.HEARING]: 'bg-cyan-100 text-cyan-800',
      [AccessibilityNeedType.SPEECH]: 'bg-orange-100 text-orange-800',
      [AccessibilityNeedType.SENSORY]: 'bg-pink-100 text-pink-800',
    };
    return colors[need] || 'bg-gray-100 text-gray-800';
  };

  const getPresetBadge = (preset: string) => {
    const colors: Record<string, string> = {
      [InterfacePreset.LOW_STIMULUS]: 'bg-slate-100 text-slate-800',
      [InterfacePreset.HIGH_CONTRAST]: 'bg-emerald-100 text-emerald-800',
      [InterfacePreset.LARGE_TEXT]: 'bg-cyan-100 text-cyan-800',
      [InterfacePreset.SLOW_ANIMATIONS]: 'bg-indigo-100 text-indigo-800',
      [InterfacePreset.SCREEN_READER_FIRST]: 'bg-purple-100 text-purple-800',
      [InterfacePreset.KEYBOARD_NAV_ONLY]: 'bg-amber-100 text-amber-800',
      [InterfacePreset.CUSTOM]: 'bg-rose-100 text-rose-800',
    };
    return colors[preset] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      [AccommodationRequestStatus.OPEN]: 'bg-red-100 text-red-800',
      [AccommodationRequestStatus.IN_REVIEW]: 'bg-amber-100 text-amber-800',
      [AccommodationRequestStatus.READY]: 'bg-blue-100 text-blue-800',
      [AccommodationRequestStatus.FULFILLED]: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading accessibility-first communities...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Accessibility-First Communities</h2>
        <p className="text-gray-500 mt-2">
          Social spaces built exclusively for users with physical or cognitive disabilities, with fully customized neural interfaces
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Request an accommodation</CardTitle>
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
            <Input value={requestForm.title} onChange={(event) => setRequestForm((current) => ({ ...current, title: event.target.value }))} placeholder="Need high-contrast voice navigation" />
          </div>
          <div className="space-y-2">
            <Label>Need type</Label>
            <Select value={requestForm.needType} onValueChange={(value) => setRequestForm((current) => ({ ...current, needType: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AccessibilityNeedType).map(([key, value]) => (
                  <SelectItem key={key} value={value}>{key.toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Description</Label>
            <Textarea value={requestForm.description} onChange={(event) => setRequestForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Describe the access need or interface adjustment" />
          </div>
          <div className="space-y-2">
            <Label>Requested adjustments</Label>
            <Input value={requestForm.requestedAdjustments} onChange={(event) => setRequestForm((current) => ({ ...current, requestedAdjustments: event.target.value }))} placeholder="captioning, keyboard shortcuts, reduced motion" />
          </div>
          <div className="space-y-2">
            <Label>Urgency</Label>
            <Select value={requestForm.isUrgent ? 'urgent' : 'standard'} onValueChange={(value) => setRequestForm((current) => ({ ...current, isUrgent: value === 'urgent' }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Interface settings JSON</Label>
            <Textarea value={requestForm.interfaceSettings} onChange={(event) => setRequestForm((current) => ({ ...current, interfaceSettings: event.target.value }))} rows={3} placeholder='{"speechRate": 0.8, "contrast": "high"}' />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={createRequest} disabled={!isMember(selectedCommunityId)}>
              Publish accommodation request
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Join with your access preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Your role</Label>
            <Input value={joinForm.role} onChange={(event) => setJoinForm((current) => ({ ...current, role: event.target.value }))} placeholder="member, advocate, moderator" />
          </div>
          <div className="space-y-2">
            <Label>Accessibility needs</Label>
            <Input value={joinForm.accessibilityNeeds} onChange={(event) => setJoinForm((current) => ({ ...current, accessibilityNeeds: event.target.value }))} placeholder="visual, hearing, cognitive" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Preferred interface preset</Label>
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(InterfacePreset).map(([key, value]) => (
                  <SelectItem key={key} value={value}>{key.toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Custom interface settings JSON</Label>
            <Textarea value={joinForm.customSettings} onChange={(event) => setJoinForm((current) => ({ ...current, customSettings: event.target.value }))} rows={3} placeholder='{"textSize": "large", "speech": true}' />
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
                  {community.supportedNeeds.map((need) => (
                    <Badge key={need} className={getNeedBadge(need)}>{need}</Badge>
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
                  <p className="text-xs uppercase text-gray-500">Open requests</p>
                  <p className="text-xl font-semibold">{community.activeRequests}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs uppercase text-gray-500">Interface profiles</p>
                  <p className="text-sm font-medium">{(community.interfaceProfiles ?? []).join(', ') || 'Custom'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Accessibility features</h4>
                <div className="flex flex-wrap gap-2">
                  {(community.accessibilityFeatures ?? []).map((feature) => (
                    <Badge key={feature} className="bg-slate-100 text-slate-800">{feature}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Interface templates</h4>
                <div className="flex flex-wrap gap-2">
                  {(community.customInterfaceTemplates ?? []).map((template) => (
                    <Badge key={template} className={getPresetBadge(template)}>{template}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between flex-wrap">
                <p className="text-sm text-gray-500">Designed for inclusive, adjustable participation</p>
                {isMember(community.id) ? (
                  <Button variant="destructive" onClick={() => leaveCommunity(community.id)}>Leave</Button>
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
            <CardTitle className="text-lg">Live accommodation requests in {selectedCommunity.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requestsLoading && <p className="text-sm text-gray-500">Loading accommodation requests...</p>}
            {!requestsLoading && requests.map((request) => (
              <div key={request.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-sm">{request.title}</p>
                  <div className="flex gap-2">
                    <Badge className={request.isUrgent ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}>{request.isUrgent ? 'urgent' : 'standard'}</Badge>
                    <Badge className={getStatusBadge(request.status)}>{request.status}</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{request.description}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>Need: {request.needType}</span>
                  {request.requester?.username && <span>Posted by: {request.requester.username}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateRequestStatus(request.id, AccommodationRequestStatus.IN_REVIEW)}>Review</Button>
                  <Button size="sm" variant="outline" onClick={() => updateRequestStatus(request.id, AccommodationRequestStatus.READY)}>Prepare</Button>
                  <Button size="sm" variant="outline" onClick={() => updateRequestStatus(request.id, AccommodationRequestStatus.FULFILLED)}>Fulfill</Button>
                </div>
              </div>
            ))}
            {!requestsLoading && requests.length === 0 && (
              <p className="text-sm text-gray-500">No accommodation requests yet. Publish the first accessibility request for this community.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};