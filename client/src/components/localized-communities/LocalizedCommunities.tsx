import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import api from '../../lib/api';

const CommunityType = {
  NEIGHBORHOOD: 'neighborhood',
  CITY: 'city',
  DISTRICT: 'district',
  LOCAL_CLUB: 'local_club',
};

interface LocalizedCommunity {
  id: string;
  name: string;
  type: string;
  description?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  digitalFeatures?: string[];
  memberCount: number;
  creator?: any;
  createdAt: string;
}

interface LocalizedCommunityMember {
  id: string;
  communityId: string;
  userId: string;
  localRole?: string;
  joinedAt: string;
  community?: LocalizedCommunity;
}

export const LocalizedCommunities: React.FC = () => {
  const [communities, setCommunities] = useState<LocalizedCommunity[]>([]);
  const [myMemberships, setMyMemberships] = useState<LocalizedCommunityMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [commsRes, memsRes] = await Promise.all([
        api.get('/localized-communities'),
        api.get('/localized-communities/user/my-memberships'),
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
      await api.post(`/localized-communities/${id}/join`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const leaveCommunity = async (id: string) => {
    try {
      await api.delete(`/localized-communities/${id}/leave`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      [CommunityType.NEIGHBORHOOD]: 'bg-green-100 text-green-800',
      [CommunityType.CITY]: 'bg-blue-100 text-blue-800',
      [CommunityType.DISTRICT]: 'bg-purple-100 text-purple-800',
      [CommunityType.LOCAL_CLUB]: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading localized communities...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Localized Physical-Digital Communities</h2>
        <p className="text-gray-500 mt-2">
          Hyper-local social networks that merge in-person neighborhood interactions with digital enhancement
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
                  {comm.locationName && (
                    <p className="text-sm text-gray-600 mt-1">
                      📍 {comm.locationName} {comm.radiusKm && `(${comm.radiusKm}km radius)`}
                    </p>
                  )}
                </div>
                <Badge className={getTypeBadge(comm.type)}>
                  {comm.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {comm.digitalFeatures && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Digital Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {comm.digitalFeatures.map((feature, i) => (
                      <Badge key={i} className="bg-slate-100 text-slate-800">
                        {feature}
                      </Badge>
                    ))}
                  </div>
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
              <p className="text-gray-500">No localized communities yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
