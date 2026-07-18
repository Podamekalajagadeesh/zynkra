import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import api from '../../lib/api';

const FilterIntensity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CUSTOM: 'custom',
} as const;

const SessionType = {
  NEURAL_CONTENT: 'neural_content',
  REGULAR_CONTENT: 'regular_content',
  STREAMING: 'streaming',
} as const;

interface MindfulnessSetting {
  id: string;
  enabled: boolean;
  filterIntensity: string;
  dailyTimeLimit: number;
  maxSessionDuration: number;
  stressDetectionEnabled: boolean;
  breakRemindersEnabled: boolean;
  breakReminderInterval: number;
  doNotDisturbEnabled: boolean;
}

interface UsageDay {
  date: string;
  duration: number;
  count: number;
}

interface UsageStats {
  setting: MindfulnessSetting;
  today: {
    totalDuration: number;
    sessions: any[];
    count: number;
  };
  last7Days: UsageDay[];
}

export const Mindfulness: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionTimer, setSessionTimer] = useState(0);

  const fetchData = async () => {
    try {
      const res = await api.get('/mindfulness/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch mindfulness data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession) {
      interval = setInterval(() => {
        setSessionTimer(Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      await api.patch('/mindfulness/settings', { [key]: value });
      await fetchData();
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleStartSession = async () => {
    try {
      const res = await api.post('/mindfulness/session/start', {
        sessionType: SessionType.NEURAL_CONTENT,
      });
      setActiveSession(res.data);
      setSessionTimer(0);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/mindfulness/session/${activeSession.id}/end`);
      setActiveSession(null);
      setSessionTimer(0);
      await fetchData();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getFilterIntensityLabel = (intensity: string) => {
    const labels: Record<string, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      custom: 'Custom',
    };
    return labels[intensity] || intensity;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading mindfulness settings...</p>
      </div>
    );
  }

  const setting = stats?.setting;
  const chartData = stats?.last7Days.map(day => ({
    ...day,
    duration: Math.round(day.duration / 60), // convert to minutes
  })) || [];

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Mindfulness Neural Filters</h2>
          <p className="text-gray-500 mt-2">
            AI that limits your content consumption to protect your mental health
          </p>
        </div>
        {setting && (
          <Badge className={setting.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {setting.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        )}
      </div>

      {activeSession && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Active Session</h3>
                <p className="text-3xl font-bold text-amber-700">{formatDuration(sessionTimer)}</p>
              </div>
              <Button variant="destructive" onClick={handleEndSession}>
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!activeSession && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Button onClick={handleStartSession} className="w-full">
              Start Monitoring Session
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today's Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatDuration(stats?.today.totalDuration || 0)}</p>
            {setting && (
              <p className="text-sm text-gray-500">
                Limit: {setting.dailyTimeLimit} minutes
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sessions Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.today.count || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatDuration(stats?.last7Days.reduce((sum, d) => sum + d.duration, 0) || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Usage History (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="duration" fill="#10b981" name="Usage (minutes)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Today's Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.today.sessions.map((session: any) => (
                  <div key={session.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {session.sessionType}
                      </Badge>
                      {session.limitReached && (
                        <Badge className="bg-red-100 text-red-800">
                          Limit Reached
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(session.startTime).toLocaleString()} -{' '}
                      {session.endTime ? new Date(session.endTime).toLocaleString() : 'Active'}
                    </p>
                    {session.durationSeconds && (
                      <p className="text-sm font-medium">Duration: {formatDuration(session.durationSeconds)}</p>
                    )}
                  </div>
                ))}
                {stats?.today.sessions.length === 0 && (
                  <p className="text-gray-500">No sessions today</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          {setting && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Mindfulness Filters</Label>
                      <p className="text-sm text-gray-500">Turn on content consumption limits</p>
                    </div>
                    <Switch
                      checked={setting.enabled}
                      onCheckedChange={(v) => handleUpdateSetting('enabled', v)}
                    />
                  </div>

                  <div>
                    <Label>Filter Intensity</Label>
                    <Select
                      value={setting.filterIntensity}
                      onValueChange={(v) => handleUpdateSetting('filterIntensity', v)}
                      disabled={!setting.enabled}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(FilterIntensity).map((intensity) => (
                          <SelectItem key={intensity} value={intensity}>
                            {getFilterIntensityLabel(intensity)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Time Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Daily Time Limit: {setting.dailyTimeLimit} minutes</Label>
                    <Slider
                      value={[setting.dailyTimeLimit]}
                      min={15}
                      max={480}
                      step={15}
                      disabled={!setting.enabled}
                      onValueChange={(v) => handleUpdateSetting('dailyTimeLimit', v[0])}
                      className="mt-4"
                    />
                  </div>

                  <div>
                    <Label>Max Session Duration: {setting.maxSessionDuration} minutes</Label>
                    <Slider
                      value={[setting.maxSessionDuration]}
                      min={5}
                      max={120}
                      step={5}
                      disabled={!setting.enabled}
                      onValueChange={(v) => handleUpdateSetting('maxSessionDuration', v[0])}
                      className="mt-4"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Stress Detection</Label>
                      <p className="text-sm text-gray-500">Monitor stress levels from neural activity</p>
                    </div>
                    <Switch
                      checked={setting.stressDetectionEnabled}
                      onCheckedChange={(v) => handleUpdateSetting('stressDetectionEnabled', v)}
                      disabled={!setting.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Break Reminders</Label>
                      <p className="text-sm text-gray-500">Get reminders to take breaks</p>
                    </div>
                    <Switch
                      checked={setting.breakRemindersEnabled}
                      onCheckedChange={(v) => handleUpdateSetting('breakRemindersEnabled', v)}
                      disabled={!setting.enabled}
                    />
                  </div>

                  {setting.breakRemindersEnabled && (
                    <div>
                      <Label>Break Reminder Interval: {setting.breakReminderInterval} minutes</Label>
                      <Slider
                        value={[setting.breakReminderInterval]}
                        min={5}
                        max={60}
                        step={5}
                        disabled={!setting.enabled}
                        onValueChange={(v) => handleUpdateSetting('breakReminderInterval', v[0])}
                        className="mt-4"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Do Not Disturb</Label>
                      <p className="text-sm text-gray-500">Block all content notifications</p>
                    </div>
                    <Switch
                      checked={setting.doNotDisturbEnabled}
                      onCheckedChange={(v) => handleUpdateSetting('doNotDisturbEnabled', v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
