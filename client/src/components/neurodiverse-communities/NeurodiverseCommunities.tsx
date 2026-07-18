import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import api from '../../lib/api';

const NeurodiversityType = {
  AUTISM: 'autism',
  ADHD: 'adhd',
  DYSLEXIA: 'dyslexia',
  DYSCALCULIA: 'dyscalculia',
  TOURETTES: 'tourettes',
  OTHER: 'other',
};

const InterfacePreset = {
  LOW_STIMULUS: 'low_stimulus',
  HIGH_CONTRAST: 'high_contrast',
  SLOW_ANIMATIONS: 'slow_animations',
  LARGE_TEXT: 'large_text',
  CUSTOM: 'custom',
};

interface NeurodiverseCommunity {
  id: string;
  name: string;
  primaryNeurodiversities: string[];
  description?: string;
  recommendedPreset?: string;
  customSettings?: Record<string, any>;
  memberCount: number;
  creator?: any;
  createdAt: string;
}

interface NeurodiverseCommunityMember {
  id: string;
  communityId: string;
  userId: string;
  userNeurodiversities?: string[];
  preferredPreset?: string;
  joinedAt: string;
  community?: NeurodiverseCommunity;
}

export const NeurodiverseCommunities: React.FC = () => {
  const [communities, setCommunities] = useState<NeurodiverseCommunity[]>([]);
  const [myMemberships, setMyMemberships] = useState<NeurodiverseCommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string>(InterfacePreset.CUSTOM);

  const fetchData = async () => {
    try {
      const [commsRes, memsRes] = await Promise.all([
        api.get('/neurodiverse-communities'),
        api.get('/neurodiverse-communities/user/my-memberships'),
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

  const isMember = (communityId: string) => myMemberships.some(m => m.communityId === communityId);

  const joinCommunity = async (id: string) => {
    try {
      await api.post(`/neurodiverse-communities/${id}/join`, {
        preferredPreset: selectedPreset,
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const leaveCommunity = async (id: string) => {
    try {
      await api.delete(`/neurodiverse-communities/${id}/leave`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getNeurodiversityBadge = (type: string) => {
    const colors: Record<string, string> = {
      [NeurodiversityType.AUTISM]: 'bg-purple-100 text-purple-800',
      [NeurodiversityType.ADHD]: 'bg-orange-100 text-orange-800',
      [NeurodiversityType.DYSLEXIA]: 'bg-blue-100 text-blue-800',
      [NeurodiversityType.DYSCALCULIA]: 'bg-green-100 text-green-800',
      [NeurodiversityType.TOURETTES]: 'bg-pink-100 text-pink-800',
      [NeurodiversityType.OTHER]: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getPresetBadge = (preset: string) => {
    const colors: Record<string, string> = {
      [InterfacePreset.LOW_STIMULUS]: 'bg-slate-100 text-slate-800',
      [InterfacePreset.HIGH_CONTRAST]: 'bg-emerald-100 text-emerald-800',
      [InterfacePreset.SLOW_ANIMATIONS]: 'bg-indigo-100 text-indigo-800',
      [InterfacePreset.LARGE_TEXT]: 'bg-cyan-100 text-cyan-800',
      [InterfacePreset.CUSTOM]: 'bg-amber-100 text-amber-800',
    };
    return colors[preset] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading neurodiverse communities...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Niche Neurodiverse Communities</h2>
        <p className="text-gray-500 mt-2">
          Social spaces designed specifically for neurodivergent users, with neural interfaces calibrated to their needs
        </p>
      </div>

      <div className="grid gap-4 mb-6">
        {communities.map((comm) => (
          <Card key={comm.id}>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-lg">{comm.name}</CardTitle>
                  {comm.description && (
                    <p className="text-sm text-gray-500 mt-1">{comm.description}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  {comm.primaryNeurodiversities.map((type, i) => (
                    <Badge key={i} className={getNeurodiversityBadge(type)}>
                      {type}
                    </Badge>
                  ))}
                  {comm.recommendedPreset && (
                    <Badge className={getPresetBadge(comm.recommendedPreset)}>
                      Recommended: {comm.recommendedPreset}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 justify-between flex-wrap">
                <p className="text-sm text-gray-500">Members: {comm.memberCount}</p>
                <div className="flex gap-2 items-center">
                  <Label className="mb-0">Your Preferred Preset:</Label>
                  <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(InterfacePreset).map(([key, val]) => (
                        <SelectItem key={key} value={val}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isMember(comm.id) ? (
                    <Button variant="destructive" onClick={() => leaveCommunity(comm.id)}>
                      Leave
                    </Button>
                  ) : (
                    <Button onClick={() => joinCommunity(comm.id)}>Join Community</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {communities.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">No neurodiverse communities yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
