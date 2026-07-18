import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import api from '../../lib/api';

const EmotionalState = {
  CALM: 'calm',
  STRESSED: 'stressed',
  ANXIOUS: 'anxious',
  BURNOUT: 'burnout',
  ENERGETIC: 'energetic',
  NEUTRAL: 'neutral',
};

const SuggestionStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DISMISSED: 'dismissed',
  COMPLETED: 'completed',
};

interface NeuralStateLog {
  id: string;
  stressLevel: number;
  anxietyLevel: number;
  engagementLevel: number;
  emotionalState: string;
  createdAt: string;
}

interface WellbeingSuggestion {
  id: string;
  type: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface WellbeingStats {
  totalLogs: number;
  averageStress: number;
  averageAnxiety: number;
  totalSuggestions: number;
  completedSuggestions: number;
}

export const NeuralWellbeing: React.FC = () => {
  const [logs, setLogs] = useState<NeuralStateLog[]>([]);
  const [suggestions, setSuggestions] = useState<WellbeingSuggestion[]>([]);
  const [stats, setStats] = useState<WellbeingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [stressLevel, setStressLevel] = useState(0.3);
  const [anxietyLevel, setAnxietyLevel] = useState(0.2);
  const [engagementLevel, setEngagementLevel] = useState(0.6);
  const [emotionalState, setEmotionalState] = useState('neutral');

  const fetchData = async () => {
    try {
      const [logsRes, sugRes, statsRes] = await Promise.all([
        api.get('/neural-wellbeing/logs'),
        api.get('/neural-wellbeing/suggestions'),
        api.get('/neural-wellbeing/stats'),
      ]);
      setLogs(logsRes.data);
      setSuggestions(sugRes.data);
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

  const logCurrentState = async () => {
    try {
      await api.post('/neural-wellbeing/log', {
        stressLevel,
        anxietyLevel,
        engagementLevel,
        emotionalState,
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateSuggestionStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/neural-wellbeing/suggestions/${id}/status`, { status });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getEmotionalStateBadge = (state: string) => {
    const colors = {
      [EmotionalState.CALM]: 'bg-green-100 text-green-800',
      [EmotionalState.STRESSED]: 'bg-red-100 text-red-800',
      [EmotionalState.ANXIOUS]: 'bg-orange-100 text-orange-800',
      [EmotionalState.BURNOUT]: 'bg-rose-100 text-rose-800',
      [EmotionalState.ENERGETIC]: 'bg-yellow-100 text-yellow-800',
      [EmotionalState.NEUTRAL]: 'bg-gray-100 text-gray-800',
    };
    return colors[state as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSuggestionStatusBadge = (status: string) => {
    const colors = {
      [SuggestionStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [SuggestionStatus.ACCEPTED]: 'bg-blue-100 text-blue-800',
      [SuggestionStatus.DISMISSED]: 'bg-gray-100 text-gray-800',
      [SuggestionStatus.COMPLETED]: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading wellbeing data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Digital Well-being Neural Assistants</h2>
        <p className="text-gray-500 mt-2">
          AI that monitors your neural state and suggests breaks to prevent burnout, anxiety, or overstimulation
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalLogs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Stress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{Math.round(stats.averageStress * 100)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Anxiety</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{Math.round(stats.averageAnxiety * 100)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalSuggestions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.completedSuggestions}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="log-state">
        <TabsList className="mb-6">
          <TabsTrigger value="log-state">Log Neural State</TabsTrigger>
          <TabsTrigger value="suggestions">Well-being Suggestions</TabsTrigger>
          <TabsTrigger value="history">State History</TabsTrigger>
        </TabsList>

        <TabsContent value="log-state">
          <Card>
            <CardHeader>
              <CardTitle>Log Your Current Neural & Emotional State</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Stress Level: {Math.round(stressLevel * 100)}%</Label>
                <Slider
                  value={[stressLevel * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val) => setStressLevel(val[0] / 100)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Anxiety Level: {Math.round(anxietyLevel * 100)}%</Label>
                <Slider
                  value={[anxietyLevel * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val) => setAnxietyLevel(val[0] / 100)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Engagement Level: {Math.round(engagementLevel * 100)}%</Label>
                <Slider
                  value={[engagementLevel * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val) => setEngagementLevel(val[0] / 100)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Emotional State</Label>
                <Select value={emotionalState} onValueChange={setEmotionalState}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EmotionalState).map(([key, val]) => (
                      <SelectItem key={key} value={val}>{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={logCurrentState}>Log Neural State</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions">
          <div className="grid gap-4">
            {suggestions.map((sug) => (
              <Card key={sug.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{sug.title}</CardTitle>
                      <p className="text-sm text-gray-500">{new Date(sug.createdAt).toLocaleString()}</p>
                    </div>
                    <Badge className={getSuggestionStatusBadge(sug.status)}>{sug.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sug.description && <p className="text-gray-600">{sug.description}</p>}
                  {sug.durationMinutes && (
                    <p className="text-sm text-gray-500">Duration: {sug.durationMinutes} min</p>
                  )}
                  {sug.status === SuggestionStatus.PENDING && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateSuggestionStatus(sug.id, SuggestionStatus.COMPLETED)}
                        size="sm"
                      >
                        Mark Completed
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => updateSuggestionStatus(sug.id, SuggestionStatus.DISMISSED)}
                        size="sm"
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {suggestions.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">No suggestions yet! Log a stressed state to receive one.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid gap-4">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {new Date(log.createdAt).toLocaleString()}
                      </CardTitle>
                    </div>
                    <Badge className={getEmotionalStateBadge(log.emotionalState)}>
                      {log.emotionalState}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-sm text-gray-600">
                    Stress: {Math.round(log.stressLevel * 100)}% | Anxiety: {Math.round(log.anxietyLevel * 100)}% | Engagement: {Math.round(log.engagementLevel * 100)}%
                  </p>
                </CardContent>
              </Card>
            ))}
            {logs.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">No neural state logs yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
