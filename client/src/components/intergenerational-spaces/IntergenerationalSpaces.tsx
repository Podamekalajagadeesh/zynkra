import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import api from '../../lib/api';

const AgeGroup = {
  YOUTH: 'youth',
  ADULT: 'adult',
  SENIOR: 'senior',
};

const KnowledgeFocus = {
  TRADITIONS: 'traditions',
  SKILLS: 'skills',
  HISTORY: 'history',
  CULTURE: 'culture',
  TECHNOLOGY: 'technology',
};

interface IntergenerationalSpace {
  id: string;
  name: string;
  focus: string;
  description?: string;
  goals?: string[];
  includedAgeGroups?: string[];
  memberCount: number;
  creator?: any;
  createdAt: string;
}

interface IntergenerationalSpaceMember {
  id: string;
  spaceId: string;
  userId: string;
  ageGroup: string;
  expertise?: string;
  learningGoals?: string;
  joinedAt: string;
  space?: IntergenerationalSpace;
}

export const IntergenerationalSpaces: React.FC = () => {
  const [spaces, setSpaces] = useState<IntergenerationalSpace[]>([]);
  const [myMemberships, setMyMemberships] = useState<IntergenerationalSpaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>(AgeGroup.ADULT);

  const fetchData = async () => {
    try {
      const [spacesRes, memsRes] = await Promise.all([
        api.get('/intergenerational-spaces'),
        api.get('/intergenerational-spaces/user/my-memberships'),
      ]);
      setSpaces(spacesRes.data);
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

  const isMember = (spaceId: string) => myMemberships.some(m => m.spaceId === spaceId);

  const joinSpace = async (id: string) => {
    try {
      await api.post(`/intergenerational-spaces/${id}/join`, {
        ageGroup: selectedAgeGroup,
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const leaveSpace = async (id: string) => {
    try {
      await api.delete(`/intergenerational-spaces/${id}/leave`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getFocusBadge = (focus: string) => {
    const colors: Record<string, string> = {
      [KnowledgeFocus.TRADITIONS]: 'bg-amber-100 text-amber-800',
      [KnowledgeFocus.SKILLS]: 'bg-blue-100 text-blue-800',
      [KnowledgeFocus.HISTORY]: 'bg-purple-100 text-purple-800',
      [KnowledgeFocus.CULTURE]: 'bg-emerald-100 text-emerald-800',
      [KnowledgeFocus.TECHNOLOGY]: 'bg-cyan-100 text-cyan-800',
    };
    return colors[focus] || 'bg-gray-100 text-gray-800';
  };

  const getAgeGroupBadge = (age: string) => {
    const colors: Record<string, string> = {
      [AgeGroup.YOUTH]: 'bg-green-100 text-green-800',
      [AgeGroup.ADULT]: 'bg-blue-100 text-blue-800',
      [AgeGroup.SENIOR]: 'bg-purple-100 text-purple-800',
    };
    return colors[age] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading intergenerational spaces...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Age-Aligned Intergenerational Spaces</h2>
        <p className="text-gray-500 mt-2">
          Platforms that intentionally connect generations to preserve knowledge, culture, and human connection
        </p>
      </div>

      <div className="grid gap-4 mb-6">
        {spaces.map((space) => (
          <Card key={space.id}>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-lg">{space.name}</CardTitle>
                  {space.description && (
                    <p className="text-sm text-gray-500 mt-1">{space.description}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getFocusBadge(space.focus)}>
                    {space.focus}
                  </Badge>
                  {space.includedAgeGroups?.map((age, i) => (
                    <Badge key={i} className={getAgeGroupBadge(age)}>
                      {age}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {space.goals && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Goals</h4>
                  <ul className="list-disc pl-5 text-gray-600">
                    {space.goals.map((goal, i) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center gap-4 justify-between flex-wrap">
                <p className="text-sm text-gray-500">Members: {space.memberCount}</p>
                <div className="flex gap-2 items-center">
                  <Label className="mb-0">Your Age Group:</Label>
                  <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AgeGroup).map(([key, val]) => (
                        <SelectItem key={key} value={val}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isMember(space.id) ? (
                    <Button variant="destructive" onClick={() => leaveSpace(space.id)}>
                      Leave
                    </Button>
                  ) : (
                    <Button onClick={() => joinSpace(space.id)}>Join Space</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {spaces.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">No intergenerational spaces yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
