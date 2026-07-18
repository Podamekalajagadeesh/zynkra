import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import api from '../../lib/api';

const ParticipantType = {
  HUMAN: 'human',
  DOMESTIC_ANIMAL: 'domestic_animal',
  WILD_ANIMAL: 'wild_animal',
  AI_ENTITY: 'ai_entity',
};

const AnimalSpecies = {
  DOG: 'dog',
  CAT: 'cat',
  BIRD: 'bird',
  HORSE: 'horse',
  RABBIT: 'rabbit',
  DOLPHIN: 'dolphin',
  APE: 'ape',
  OTHER: 'other',
};

interface SpeciesCommunity {
  id: string;
  name: string;
  includedSpecies: string[];
  animalSpecies?: string[];
  description?: string;
  communicationTools?: string[];
  memberCount: number;
  creator?: any;
  createdAt: string;
}

interface SpeciesCommunityMember {
  id: string;
  communityId: string;
  userId?: string;
  participantType: string;
  animalSpecies?: string;
  participantName?: string;
  joinedAt: string;
  community?: SpeciesCommunity;
}

export const SpeciesCommunities: React.FC = () => {
  const [communities, setCommunities] = useState<SpeciesCommunity[]>([]);
  const [myMemberships, setMyMemberships] = useState<SpeciesCommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipantType, setSelectedParticipantType] = useState<string>(ParticipantType.HUMAN);

  const fetchData = async () => {
    try {
      const [commsRes, memsRes] = await Promise.all([
        api.get('/species-communities'),
        api.get('/species-communities/user/my-memberships'),
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
      await api.post(`/species-communities/${id}/join`, {
        participantType: selectedParticipantType,
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const leaveCommunity = async (id: string) => {
    try {
      const myMembership = myMemberships.find(m => m.communityId === id);
      if (myMembership) {
        await api.delete(`/species-communities/${id}/leave/${myMembership.id}`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getParticipantBadge = (type: string) => {
    const colors: Record<string, string> = {
      [ParticipantType.HUMAN]: 'bg-blue-100 text-blue-800',
      [ParticipantType.DOMESTIC_ANIMAL]: 'bg-pink-100 text-pink-800',
      [ParticipantType.WILD_ANIMAL]: 'bg-green-100 text-green-800',
      [ParticipantType.AI_ENTITY]: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getAnimalBadge = (species: string) => {
    const colors: Record<string, string> = {
      [AnimalSpecies.DOG]: 'bg-amber-100 text-amber-800',
      [AnimalSpecies.CAT]: 'bg-cyan-100 text-cyan-800',
      [AnimalSpecies.BIRD]: 'bg-yellow-100 text-yellow-800',
      [AnimalSpecies.HORSE]: 'bg-rose-100 text-rose-800',
    };
    return colors[species] || 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading species-spanning communities...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Species-Spanning Communities</h2>
        <p className="text-gray-500 mt-2">
          Platforms that facilitate communication between humans and intelligent animals/AI entities for cross-species collaboration
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
                <div className="flex gap-2 flex-wrap">
                  {comm.includedSpecies.map((type, i) => (
                    <Badge key={i} className={getParticipantBadge(type)}>
                      {type}
                    </Badge>
                  ))}
                  {comm.animalSpecies?.map((species, i) => (
                    <Badge key={i} className={getAnimalBadge(species)}>
                      {species}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {comm.communicationTools && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Communication Tools</h4>
                  <div className="flex flex-wrap gap-2">
                    {comm.communicationTools.map((tool, i) => (
                      <Badge key={i} className="bg-slate-100 text-slate-800">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 justify-between flex-wrap">
                <p className="text-sm text-gray-500">Members: {comm.memberCount}</p>
                <div className="flex gap-2 items-center">
                  <Label className="mb-0">Your Participant Type:</Label>
                  <Select
                    value={selectedParticipantType}
                    onValueChange={setSelectedParticipantType}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ParticipantType).map(([key, val]) => (
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
              <p className="text-gray-500">No species-spanning communities yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
