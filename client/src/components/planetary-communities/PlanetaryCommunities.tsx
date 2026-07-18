import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import api from '../../lib/api';

const GlobalChallenge = {
  CLIMATE_CHANGE: 'climate_change',
  INEQUALITY: 'inequality',
  WORLD_HUNGER: 'world_hunger',
  GLOBAL_HEALTH: 'global_health',
  EDUCATION: 'education',
  PEACE: 'peace',
};

interface PlanetaryCommunity {
  id: string;
  name: string;
  focusChallenge: string;
  description?: string;
  goals?: string[];
  memberCount: number;
  creator?: any;
  createdAt: string;
}

interface PlanetaryCommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role?: string;
  joinedAt: string;
  community?: PlanetaryCommunity;
}

export const PlanetaryCommunities: React.FC = () => {
  const [communities, setCommunities] = useState<PlanetaryCommunity[]>([]);
  const [myMemberships, setMyMemberships] = useState<PlanetaryCommunityMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [commsRes, memsRes] = await Promise.all([
        api.get('/planetary-communities'),
        api.get('/planetary-communities/user/my-memberships'),
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

  const isMember = (communityId: string) =>
    myMemberships.some(m => m.communityId === communityId);

  const joinCommunity = async (id: string) => {
    try {
      await api.post(`/planetary-communities/${id}/join`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const leaveCommunity = async (id: string) => {
    try {
      await api.delete(`/planetary-communities/${id}/leave`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getChallengeBadge = (challenge: string) => {
    const colors: Record<string, string> = {
      [GlobalChallenge.CLIMATE_CHANGE]: 'bg-green-100 text-green-800',
      [GlobalChallenge.INEQUALITY]: 'bg-purple-100 text-purple-800',
      [GlobalChallenge.WORLD_HUNGER]: 'bg-orange-100 text-orange-800',
      [GlobalChallenge.GLOBAL_HEALTH]: 'bg-blue-100 text-blue-800',
      [GlobalChallenge.EDUCATION]: 'bg-yellow-100 text-yellow-800',
      [GlobalChallenge.PEACE]: 'bg-emerald-100 text-emerald-800',
    };
    return colors[challenge] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading planetary communities...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Planetary Global Communities</h2>
        <p className="text-gray-500 mt-2">
          Social groups focused on solving global challenges (climate change, inequality) that unite users worldwide
        </p>
      </div>

      <div className="grid gap-4">
        {communities.map((comm) => (
          <Card key={comm.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{comm.name}</CardTitle>
                  {comm.description && (
                    <p className="text-sm text-gray-500 mt-1">{comm.description}</p>
                  )}
                </div>
                <Badge className={getChallengeBadge(comm.focusChallenge)}>
                  {comm.focusChallenge}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {comm.goals && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Goals</h4>
                  <ul className="list-disc pl-5 text-gray-600">
                    {comm.goals.map((goal, i) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center gap-4 justify-between">
                <p className="text-sm text-gray-500">Members: {comm.memberCount}</p>
                {isMember(comm.id) ? (
                  <Button variant="destructive" onClick={() => leaveCommunity(comm.id)}>
                    Leave
                  </Button>
                ) : (
                  <Button onClick={() => joinCommunity(comm.id)}>Join Community</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {communities.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">No planetary communities yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
