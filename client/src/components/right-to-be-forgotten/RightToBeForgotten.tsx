import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import api from '../../lib/api';

const ErasureStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const ErasureDataType = {
  THOUGHTS: 'thoughts',
  MEMORIES: 'memories',
  NEURAL_DATA: 'neural_data',
  PERSONAL_DATA: 'personal_data',
  ALL: 'all',
};

interface ErasureRequest {
  id: string;
  dataTypes?: string[];
  reason?: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface ErasureStats {
  total: number;
  pending: number;
  completed: number;
}

export const RightToBeForgotten: React.FC = () => {
  const [requests, setRequests] = useState<ErasureRequest[]>([]);
  const [stats, setStats] = useState<ErasureStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['all']);

  const fetchData = async () => {
    try {
      const [reqsRes, statsRes] = await Promise.all([
        api.get('/right-to-be-forgotten/my-requests'),
        api.get('/right-to-be-forgotten/stats'),
      ]);
      setRequests(reqsRes.data);
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

  const createRequest = async () => {
    const reason = (document.getElementById('erasure-reason') as HTMLTextAreaElement)?.value;
    try {
      await api.post('/right-to-be-forgotten/request', {
        dataTypes: selectedDataTypes,
        reason: reason || undefined,
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const cancelRequest = async (id: string) => {
    try {
      await api.patch(`/right-to-be-forgotten/${id}/cancel`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      [ErasureStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [ErasureStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [ErasureStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [ErasureStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading erasure data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Right to Be Forgotten from Neural Networks</h2>
        <p className="text-gray-500 mt-2">
          Permanently erase your data, thoughts, and memories from all platforms with a single request
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="create-request">
        <TabsList className="mb-6">
          <TabsTrigger value="create-request">Create Request</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="create-request">
          <Card>
            <CardHeader>
              <CardTitle>Create Erasure Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Data Types to Erase</Label>
                <Select
                  value={selectedDataTypes[0]}
                  onValueChange={(val) => setSelectedDataTypes([val])}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ErasureDataType).map(([key, val]) => (
                      <SelectItem key={key} value={val}>{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reason (Optional)</Label>
                <Textarea id="erasure-reason" placeholder="Reason for erasure request (optional)" />
              </div>
              <Button onClick={createRequest}>Submit Erasure Request</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-requests">
          <div className="grid gap-4">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Request: {req.id}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {new Date(req.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={getStatusBadge(req.status)}>
                      {req.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {req.dataTypes && (
                    <div className="flex gap-2 flex-wrap">
                      {req.dataTypes.map((t, i) => (
                        <Badge key={i} className="bg-gray-100 text-gray-800">{t}</Badge>
                      ))}
                    </div>
                  )}
                  {req.reason && (
                    <p className="text-gray-600 text-sm">{req.reason}</p>
                  )}
                  {req.status === ErasureStatus.PENDING && (
                    <Button
                      variant="destructive"
                      onClick={() => cancelRequest(req.id)}
                      size="sm"
                    >
                      Cancel Request
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {requests.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">No erasure requests yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
