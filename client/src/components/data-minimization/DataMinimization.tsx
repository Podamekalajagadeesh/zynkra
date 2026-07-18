import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import api from '../../lib/api';

const DataPurpose = {
  ACCOUNT: 'account',
  CONTENT: 'content',
  COMMUNICATION: 'communication',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
};

interface DataMinimizationPolicy {
  id: string;
  policyName: string;
  description: string;
  allowedDataTypes?: string[];
  requiredDataTypes?: string[];
  enabled: boolean;
  retentionDays: number;
  createdAt: string;
  updatedAt: string;
}

interface DataCollectionLog {
  id: string;
  dataTypes?: string[];
  purpose: string;
  necessary: boolean;
  minimal: boolean;
  createdAt: string;
}

interface DataMinimizationStats {
  total: number;
  necessary: number;
  minimal: number;
}

export const DataMinimization: React.FC = () => {
  const [policy, setPolicy] = useState<DataMinimizationPolicy | null>(null);
  const [logs, setLogs] = useState<DataCollectionLog[]>([]);
  const [stats, setStats] = useState<DataMinimizationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [policyRes, statsRes, logsRes] = await Promise.all([
        api.get('/data-minimization/policy'),
        api.get('/data-minimization/stats'),
        api.get('/data-minimization/logs/my'),
      ]);
      setPolicy(policyRes.data);
      setStats(statsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updatePolicy = async (key: keyof DataMinimizationPolicy, value: any) => {
    try {
      await api.patch('/data-minimization/policy', { [key]: value });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading data minimization...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Data Minimization by Default</h2>
        <p className="text-gray-500 mt-2">
          Platforms only collect the exact data they need to function, no bulk data harvesting
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Necessary Only</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.necessary}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Minimized Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">{stats.minimal}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="policy">
        <TabsList className="mb-6">
          <TabsTrigger value="policy">Policy</TabsTrigger>
          <TabsTrigger value="logs">Collection Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="policy">
          {policy && (
            <Card>
              <CardHeader>
                <CardTitle>Data Minimization Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Policy Name</Label>
                  <p className="text-lg font-medium">{policy.policyName}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-gray-600">{policy.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Policy Enabled</Label>
                    <p className="text-sm text-gray-500">Toggle data minimization enforcement</p>
                  </div>
                  <Switch
                    checked={policy.enabled}
                    onCheckedChange={(v) => updatePolicy('enabled', v)}
                  />
                </div>
                <div>
                  <Label>Data Retention: {policy.retentionDays} Days</Label>
                  <Slider
                    value={[policy.retentionDays]}
                    min={7}
                    max={365}
                    step={7}
                    onValueChange={(v) => updatePolicy('retentionDays', v[0])}
                    className="mt-2"
                  />
                </div>
                {policy.requiredDataTypes && (
                  <div>
                    <Label>Required Data Types</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {policy.requiredDataTypes.map((type, index) => (
                        <Badge key={index} className="bg-green-100 text-green-800">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {policy.allowedDataTypes && (
                  <div>
                    <Label>Allowed Data Types</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {policy.allowedDataTypes.map((type, index) => (
                        <Badge key={index} className="bg-blue-100 text-blue-800">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <div className="grid gap-4">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      Purpose: {log.purpose}
                    </CardTitle>
                    <div className="flex gap-2">
                      {log.necessary && (
                        <Badge className="bg-green-100 text-green-800">
                          Necessary
                        </Badge>
                      )}
                      {log.minimal && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Minimal
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent>
                  {log.dataTypes && (
                    <div className="flex flex-wrap gap-2">
                      {log.dataTypes.map((type, index) => (
                        <Badge key={index} className="bg-gray-100 text-gray-800">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {logs.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">No data collection logs yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
