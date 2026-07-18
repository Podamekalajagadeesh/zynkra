import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import api from '../../lib/api';

const BoardRegion = {
  GLOBAL: 'global',
  NORTH_AMERICA: 'north_america',
  EUROPE: 'europe',
  ASIA_PACIFIC: 'asia_pacific',
  LATIN_AMERICA: 'latin_america',
};

const AuditStatus = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

interface EthicsBoard {
  id: string;
  name: string;
  region: string;
  description?: string;
  members?: string[];
  focusAreas?: string[];
  active: boolean;
  createdAt: string;
}

interface EthicsAudit {
  id: string;
  title: string;
  description?: string;
  status: string;
  scheduledDate?: string;
  completedDate?: string;
  findings?: Record<string, any>;
  recommendations?: string[];
  board?: EthicsBoard;
  createdAt: string;
}

interface EthicsStats {
  totalBoards: number;
  totalAudits: number;
  completedAudits: number;
}

export const NeuralEthicsBoards: React.FC = () => {
  const [boards, setBoards] = useState<EthicsBoard[]>([]);
  const [audits, setAudits] = useState<EthicsAudit[]>([]);
  const [stats, setStats] = useState<EthicsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [boardsRes, auditsRes, statsRes] = await Promise.all([
        api.get('/neural-ethics-boards/boards'),
        api.get('/neural-ethics-boards/audits'),
        api.get('/neural-ethics-boards/stats'),
      ]);
      setBoards(boardsRes.data);
      setAudits(auditsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRegionBadge = (region: string) => {
    const colors = {
      [BoardRegion.GLOBAL]: 'bg-purple-100 text-purple-800',
      [BoardRegion.EUROPE]: 'bg-blue-100 text-blue-800',
      [BoardRegion.NORTH_AMERICA]: 'bg-green-100 text-green-800',
      [BoardRegion.ASIA_PACIFIC]: 'bg-yellow-100 text-yellow-800',
      [BoardRegion.LATIN_AMERICA]: 'bg-red-100 text-red-800',
    };
    return colors[region as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getAuditStatusBadge = (status: string) => {
    const colors = {
      [AuditStatus.SCHEDULED]: 'bg-yellow-100 text-yellow-800',
      [AuditStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [AuditStatus.COMPLETED]: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading ethics boards...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Independent Neural Ethics Boards</h2>
        <p className="text-gray-500 mt-2">
          Global third-party organizations that audit platform neural technology for safety and equity
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Boards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalBoards}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Audits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalAudits}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completed Audits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.completedAudits}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="boards">
        <TabsList className="mb-6">
          <TabsTrigger value="boards">Ethics Boards</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="boards">
          <div className="grid gap-4">
            {boards.map((board) => (
              <Card key={board.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{board.name}</CardTitle>
                      {board.description && (
                        <p className="text-sm text-gray-500">{board.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getRegionBadge(board.region)}>
                        {board.region}
                      </Badge>
                      {board.active && (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {board.focusAreas && (
                    <div>
                      <Label>Focus Areas</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {board.focusAreas.map((area, i) => (
                          <Badge key={i} className="bg-gray-100 text-gray-800">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {boards.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">No ethics boards yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="audits">
          <div className="grid gap-4">
            {audits.map((audit) => (
              <Card key={audit.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{audit.title}</CardTitle>
                      {audit.description && (
                        <p className="text-sm text-gray-500">{audit.description}</p>
                      )}
                    </div>
                    <Badge className={getAuditStatusBadge(audit.status)}>
                      {audit.status}
                    </Badge>
                  </div>
                  {audit.board && (
                    <p className="text-xs text-gray-400">
                      Board: {audit.board.name}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {audit.scheduledDate && (
                      <div>
                        <Label>Scheduled</Label>
                        <p>{new Date(audit.scheduledDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {audit.completedDate && (
                      <div>
                        <Label>Completed</Label>
                        <p>{new Date(audit.completedDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  {audit.recommendations && (
                    <div>
                      <Label>Recommendations</Label>
                      <ul className="list-disc pl-5 mt-2 text-gray-600">
                        {audit.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {audits.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">No ethics audits yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
