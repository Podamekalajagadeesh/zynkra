import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import api from '../../lib/api';

const NeuralContentType = {
  THOUGHT: 'thought',
  EMOTION: 'emotion',
  MEMORY: 'memory',
  SENSORY: 'sensory',
} as const;

const AccessLevel = {
  PRIVATE: 'private',
  FRIENDS: 'friends',
  CONNECTIONS: 'connections',
  PUBLIC: 'public',
} as const;

interface PrivacySetting {
  id: string;
  contentType: string;
  accessLevel: string;
  tempAccessEnabled: boolean;
  tempAccessStart?: string;
  tempAccessEnd?: string;
}

interface AccessLog {
  id: string;
  action: string;
  contentType?: string;
  details?: string;
  createdAt: string;
  accessingUser?: any;
}

export const NeuralPrivacy: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySetting[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContentType, setSelectedContentType] = useState<string>('thought');
  const [tempAccessUsers, setTempAccessUsers] = useState<string>('');
  const [tempAccessDuration, setTempAccessDuration] = useState<number>(24);

  const fetchData = async () => {
    try {
      const [settingsRes, logsRes] = await Promise.all([
        api.get('/neural-privacy/settings'),
        api.get('/neural-privacy/access-logs'),
      ]);
      setSettings(settingsRes.data);
      setAccessLogs(logsRes.data);
    } catch (error) {
      console.error('Failed to fetch privacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSettingForType = (type: string) => {
    return settings.find(s => s.contentType === type) || {
      contentType: type,
      accessLevel: 'private',
      tempAccessEnabled: false,
    };
  };

  const handleUpdateAccessLevel = async (contentType: string, accessLevel: string) => {
    try {
      await api.patch(`/neural-privacy/settings/${contentType}`, { accessLevel });
      await fetchData();
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleGrantTempAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const allowedUserIds = tempAccessUsers.split(',').map(id => id.trim()).filter(id => id);
    try {
      await api.post('/neural-privacy/temp-access', {
        contentType: selectedContentType,
        allowedUserIds,
        durationHours: tempAccessDuration,
      });
      await fetchData();
      setTempAccessUsers('');
    } catch (error) {
      console.error('Failed to grant temp access:', error);
    }
  };

  const handleRevokeTempAccess = async (contentType: string) => {
    try {
      await api.post('/neural-privacy/temp-access/revoke', { contentType });
      await fetchData();
    } catch (error) {
      console.error('Failed to revoke temp access:', error);
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      thought: 'Thoughts',
      emotion: 'Emotions',
      memory: 'Memories',
      sensory: 'Sensory Data',
    };
    return labels[type] || type;
  };

  const getAccessLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      private: 'Private',
      friends: 'Friends Only',
      connections: 'Connections',
      public: 'Public',
    };
    return labels[level] || level;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading privacy settings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Neural Privacy Controls</h2>
        <p className="text-gray-500 mt-2">
          Granular controls over what thoughts, emotions, and memories you share
        </p>
      </div>

      <Tabs defaultValue="settings">
        <TabsList className="mb-6">
          <TabsTrigger value="settings">Privacy Settings</TabsTrigger>
          <TabsTrigger value="temp-access">Temporary Access</TabsTrigger>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="grid gap-6">
            {Object.values(NeuralContentType).map((type) => {
              const setting = getSettingForType(type);
              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getContentTypeLabel(type)}
                      {setting.tempAccessEnabled && (
                        <Badge className="bg-amber-100 text-amber-800">
                          Temp Access Active
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="mb-2 block">Access Level</Label>
                        <Select
                          value={setting.accessLevel}
                          onValueChange={(value) => handleUpdateAccessLevel(type, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(AccessLevel).map((level) => (
                              <SelectItem key={level} value={level}>
                                {getAccessLevelLabel(level)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {setting.tempAccessEnabled && setting.tempAccessEnd && (
                        <div className="text-sm text-gray-500">
                          Expires: {new Date(setting.tempAccessEnd).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="temp-access">
          <Card>
            <CardHeader>
              <CardTitle>Grant Temporary Access</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGrantTempAccess} className="space-y-4">
                <div>
                  <Label>Content Type</Label>
                  <Select
                    value={selectedContentType}
                    onValueChange={setSelectedContentType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(NeuralContentType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getContentTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>User IDs (comma separated)</Label>
                  <input
                    type="text"
                    value={tempAccessUsers}
                    onChange={(e) => setTempAccessUsers(e.target.value)}
                    className="w-full border rounded-md p-2 mt-2"
                    placeholder="user-123, user-456"
                  />
                </div>
                <div>
                  <Label>Duration (hours)</Label>
                  <input
                    type="number"
                    value={tempAccessDuration}
                    onChange={(e) => setTempAccessDuration(parseInt(e.target.value))}
                    className="w-full border rounded-md p-2 mt-2"
                    min={1}
                  />
                </div>
                <Button type="submit">Grant Temporary Access</Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Active Temporary Access</h3>
            <div className="grid gap-4">
              {settings.filter(s => s.tempAccessEnabled).map((setting) => (
                <Card key={setting.id}>
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <h4 className="font-medium">{getContentTypeLabel(setting.contentType)}</h4>
                      {setting.tempAccessEnd && (
                        <p className="text-sm text-gray-500">
                          Expires: {new Date(setting.tempAccessEnd).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleRevokeTempAccess(setting.contentType)}
                    >
                      Revoke
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {settings.filter(s => s.tempAccessEnabled).length === 0 && (
                <p className="text-gray-500">No active temporary access</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Access Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessLogs.map((log) => (
                  <div key={log.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        className={
                          log.action === 'grant'
                            ? 'bg-green-100 text-green-800'
                            : log.action === 'revoke'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {log.action}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {log.contentType && (
                      <p className="text-sm">Content: {getContentTypeLabel(log.contentType)}</p>
                    )}
                    {log.details && <p className="text-sm text-gray-600">{log.details}</p>}
                    {log.accessingUser && (
                      <p className="text-sm text-gray-500">
                        By: {log.accessingUser.username || log.accessingUser.id}
                      </p>
                    )}
                  </div>
                ))}
                {accessLogs.length === 0 && (
                  <p className="text-gray-500">No access logs yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
