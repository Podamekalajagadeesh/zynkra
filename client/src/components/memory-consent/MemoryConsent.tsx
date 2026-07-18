import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import api from '../../lib/api';

const ConsentStatus = {
  PENDING: 'pending',
  GRANTED: 'granted',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
} as const;

const RedactionLevel = {
  NONE: 'none',
  PARTIAL: 'partial',
  FULL: 'full',
} as const;

interface ConsentRequest {
  id: string;
  memoryId: string;
  requesterId: string;
  recipientId: string;
  requester?: any;
  recipient?: any;
  includedUserIds?: string[];
  status: string;
  requestMessage?: string;
  responseMessage?: string;
  grantedRedactionLevels?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface RedactionRule {
  id: string;
  userId: string;
  description?: string;
  allowedContexts?: string[];
  autoApproveLowSensitivity: boolean;
  requireReviewForHighSensitivity: boolean;
  defaultRedactionLevel: string;
  createdAt: string;
  updatedAt: string;
}

interface ConsentStats {
  pending: number;
  granted: number;
  revoked: number;
}

export const MemoryConsent: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<ConsentRequest[]>([]);
  const [myRequests, setMyRequests] = useState<ConsentRequest[]>([]);
  const [rules, setRules] = useState<RedactionRule[]>([]);
  const [stats, setStats] = useState<ConsentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [pendingRes, myRes, rulesRes, statsRes] = await Promise.all([
        api.get('/memory-consent/my/pending'),
        api.get('/memory-consent/my/requests'),
        api.get('/memory-consent/rules/my'),
        api.get('/memory-consent/stats'),
      ]);
      setPendingRequests(pendingRes.data);
      setMyRequests(myRes.data);
      setRules(rulesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch consent data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGrantConsent = async (requestId: string, grantedLevels: Record<string, string>, message?: string) => {
    try {
      await api.patch(`/memory-consent/${requestId}/grant`, {
        grantedRedactionLevels: grantedLevels,
        responseMessage: message,
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to grant consent:', error);
    }
  };

  const handleRevokeConsent = async (requestId: string, message?: string) => {
    try {
      await api.patch(`/memory-consent/${requestId}/revoke`, {
        responseMessage: message,
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to revoke consent:', error);
    }
  };

  const handleCreateRule = async (data: any) => {
    try {
      await api.post('/memory-consent/rules', data);
      await fetchData();
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badgeClasses: Record<string, string> = {
      [ConsentStatus.PENDING]: 'bg-amber-100 text-amber-800',
      [ConsentStatus.GRANTED]: 'bg-green-100 text-green-800',
      [ConsentStatus.REVOKED]: 'bg-red-100 text-red-800',
      [ConsentStatus.EXPIRED]: 'bg-gray-100 text-gray-800',
    };
    return badgeClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      [ConsentStatus.PENDING]: 'Pending',
      [ConsentStatus.GRANTED]: 'Granted',
      [ConsentStatus.REVOKED]: 'Revoked',
      [ConsentStatus.EXPIRED]: 'Expired',
    };
    return labels[status] || status;
  };

  const getRedactionLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      [RedactionLevel.NONE]: 'No Redaction',
      [RedactionLevel.PARTIAL]: 'Partial Redaction',
      [RedactionLevel.FULL]: 'Full Redaction',
    };
    return labels[level] || level;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading consent settings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Consent-Based Memory Sharing</h2>
        <p className="text-gray-500 mt-2">
          Explicit, revocable consent required to share memories with automatic redaction
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Granted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.granted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Revoked</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{stats.revoked}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending Decisions</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          <TabsTrigger value="rules">Redaction Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Request from {request.requester?.username || request.requesterId}
                    </CardTitle>
                    <Badge className={getStatusBadge(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.requestMessage && (
                    <div>
                      <Label>Request Message</Label>
                      <p className="text-gray-600">{request.requestMessage}</p>
                    </div>
                  )}

                  {request.includedUserIds && request.includedUserIds.length > 0 && (
                    <div>
                      <Label>Included Users</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {request.includedUserIds.map((uid) => (
                          <Badge key={uid} className="bg-gray-100 text-gray-800">
                            {uid}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.status === ConsentStatus.PENDING && (
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Response Message (Optional)</Label>
                        <Textarea id={`resp-${request.id}`} placeholder="Add a message..." />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            const resp = (document.getElementById(`resp-${request.id}`) as HTMLTextAreaElement)?.value;
                            const grantedLevels = (request.includedUserIds || []).reduce((acc, uid) => {
                              acc[uid] = RedactionLevel.PARTIAL;
                              return acc;
                            }, {} as Record<string, string>);
                            handleGrantConsent(request.id, grantedLevels, resp);
                          }}
                        >
                          Grant Consent
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            const resp = (document.getElementById(`resp-${request.id}`) as HTMLTextAreaElement)?.value;
                            handleRevokeConsent(request.id, resp);
                          }}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {pendingRequests.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">No pending consent requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-requests">
          <div className="grid gap-4">
            {myRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      To: {request.recipient?.username || request.recipientId}
                    </CardTitle>
                    <Badge className={getStatusBadge(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent>
                  {request.requestMessage && (
                    <div>
                      <Label>Your Request</Label>
                      <p className="text-gray-600">{request.requestMessage}</p>
                    </div>
                  )}
                  {request.responseMessage && (
                    <div className="mt-4">
                      <Label>Response</Label>
                      <p className="text-gray-600">{request.responseMessage}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {myRequests.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">You haven't made any sharing requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Redaction Rule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Textarea id="rule-desc" placeholder="Describe your redaction rule..." />
                </div>
                <div>
                  <Label>Default Redaction Level</Label>
                  <Select defaultValue={RedactionLevel.PARTIAL}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(RedactionLevel).map((level) => (
                        <SelectItem key={level} value={level}>
                          {getRedactionLevelLabel(level)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => {
                    const desc = (document.getElementById('rule-desc') as HTMLTextAreaElement)?.value;
                    handleCreateRule({
                      description: desc,
                      defaultRedactionLevel: RedactionLevel.PARTIAL,
                      autoApproveLowSensitivity: true,
                      requireReviewForHighSensitivity: true,
                    });
                  }}
                >
                  Create Rule
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {rule.description || 'Redaction Rule'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Default Level</Label>
                        <p className="text-gray-600">{getRedactionLevelLabel(rule.defaultRedactionLevel)}</p>
                      </div>
                      <div>
                        <Label>Auto-Approve Low Sensitivity</Label>
                        <p className="text-gray-600">{rule.autoApproveLowSensitivity ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {rules.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-gray-500">No redaction rules yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
