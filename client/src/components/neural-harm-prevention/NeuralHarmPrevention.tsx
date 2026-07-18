import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import api from '../../lib/api';

const HarmType = {
  SEIZURE_RISK: 'seizure_risk',
  EMOTIONAL_DISTRESS: 'emotional_distress',
  OVERSTIMULATION: 'overstimulation',
  UNKNOWN: 'unknown',
};

const ActionTaken = {
  BLOCKED: 'blocked',
  MODIFIED: 'modified',
  WARNED: 'warned',
  NOTHING: 'nothing',
};

interface UserHarmPreferences {
  id: string;
  seizureRiskBlocked: boolean;
  emotionalDistressBlocked: boolean;
  seizureRiskThreshold: number;
  emotionalDistressThreshold: number;
  warnBeforeBlocking: boolean;
}

interface HarmPreventionLog {
  id: string;
  contentId: string;
  harmType: string;
  action: string;
  riskScore: number;
  details?: string;
  createdAt: string;
}

interface HarmStats {
  total: number;
  blocked: number;
  warned: number;
  seizure: number;
  distress: number;
}

export const NeuralHarmPrevention: React.FC = () => {
  const [preferences, setPreferences] = useState<UserHarmPreferences | null>(null);
  const [logs, setLogs] = useState<HarmPreventionLog[]>([]);
  const [stats, setStats] = useState<HarmStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testContentId, setTestContentId] = useState('test-content-123');

  const fetchData = async () => {
    try {
      const [prefsRes, logsRes, statsRes] = await Promise.all([
        api.get('/neural-harm-prevention/preferences'),
        api.get('/neural-harm-prevention/logs/my'),
        api.get('/neural-harm-prevention/stats'),
      ]);
      setPreferences(prefsRes.data);
      setLogs(logsRes.data);
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

  const updatePreferences = async (key: keyof UserHarmPreferences, value: any) => {
    try {
      await api.patch('/neural-harm-prevention/preferences', { [key]: value });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const testContentCheck = async () => {
    try {
      const metadata = {
        hasRapidFlashing: Math.random() > 0.5,
        hasHighEmotionalDistress: Math.random() > 0.5,
      };
      const result = await api.post('/neural-harm-prevention/check-content', {
        contentId: testContentId,
        contentMetadata: metadata,
      });
      alert(`Check result: ${JSON.stringify(result.data, null, 2)}`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getHarmTypeBadge = (type: string) => {
    const colors = {
      [HarmType.SEIZURE_RISK]: 'bg-red-100 text-red-800',
      [HarmType.EMOTIONAL_DISTRESS]: 'bg-orange-100 text-orange-800',
      [HarmType.OVERSTIMULATION]: 'bg-yellow-100 text-yellow-800',
      [HarmType.UNKNOWN]: 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getActionBadge = (action: string) => {
    const colors = {
      [ActionTaken.BLOCKED]: 'bg-red-100 text-red-800',
      [ActionTaken.WARNED]: 'bg-yellow-100 text-yellow-800',
      [ActionTaken.MODIFIED]: 'bg-blue-100 text-blue-800',
      [ActionTaken.NOTHING]: 'bg-green-100 text-green-800',
    };
    return colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading prevention data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Neural Harm Prevention</h2>
        <p className="text-gray-500 mt-2">
          AI that blocks external content from causing negative neural impacts (seizures, emotional distress)
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Blocked</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{stats.blocked}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Warned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.warned}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Seizure Risks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{stats.seizure}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Emotional Distress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-rose-600">{stats.distress}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="preferences">
        <TabsList className="mb-6">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="test-content">Test Content</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences">
          {preferences && (
            <Card>
              <CardHeader>
                <CardTitle>Harm Prevention Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Block Seizure Risk Content</Label>
                    <p className="text-sm text-gray-500">Automatically block content with rapid flashing</p>
                  </div>
                  <Switch
                    checked={preferences.seizureRiskBlocked}
                    onCheckedChange={(v) => updatePreferences('seizureRiskBlocked', v)}
                  />
                </div>
                <div>
                  <Label>Seizure Risk Threshold: {Math.round(preferences.seizureRiskThreshold * 100)}%</Label>
                  <Slider
                    value={[preferences.seizureRiskThreshold * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => updatePreferences('seizureRiskThreshold', v[0] / 100)}
                    className="mt-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Block Emotional Distress Content</Label>
                    <p className="text-sm text-gray-500">Protect from emotionally harmful content</p>
                  </div>
                  <Switch
                    checked={preferences.emotionalDistressBlocked}
                    onCheckedChange={(v) => updatePreferences('emotionalDistressBlocked', v)}
                  />
                </div>
                <div>
                  <Label>Emotional Distress Threshold: {Math.round(preferences.emotionalDistressThreshold * 100)}%</Label>
                  <Slider
                    value={[preferences.emotionalDistressThreshold * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => updatePreferences('emotionalDistressThreshold', v[0] / 100)}
                    className="mt-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Warn Before Blocking</Label>
                    <p className="text-sm text-gray-500">Show warning instead of immediate block</p>
                  </div>
                  <Switch
                    checked={preferences.warnBeforeBlocking}
                    onCheckedChange={(v) => updatePreferences('warnBeforeBlocking', v)}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="test-content">
          <Card>
            <CardHeader>
              <CardTitle>Test Harm Prevention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Test Content ID</Label>
                <input
                  type="text"
                  value={testContentId}
                  onChange={(e) => setTestContentId(e.target.value)}
                  className="w-full border rounded-md p-2 mt-2"
                />
              </div>
              <Button onClick={testContentCheck}>
                Test Random Harm Check
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <div className="grid gap-4">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">Content: {log.contentId}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getHarmTypeBadge(log.harmType)}>
                        {log.harmType}
                      </Badge>
                      <Badge className={getActionBadge(log.action)}>
                        {log.action}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Risk Score: {Math.round(log.riskScore * 100)}%</p>
                  {log.details && <p className="text-sm text-gray-500">{log.details}</p>}
                </CardContent>
              </Card>
            ))}
            {logs.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">No harm prevention logs yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
