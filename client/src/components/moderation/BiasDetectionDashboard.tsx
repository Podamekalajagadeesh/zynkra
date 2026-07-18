import { useState, useEffect } from 'react';
import { Scale, LineChart, Shield, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useToast } from '../../hooks/useToast';
import {
  analyzeBias,
  getFeedRepresentationMetrics,
  applyBiasMitigations,
  BiasAnalysisResult
} from '../../services/contentModerationService';

export function BiasDetectionDashboard() {
  const { addToast } = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [biasAnalysis, setBiasAnalysis] = useState<BiasAnalysisResult | null>(null);
  const [applyingMitigation, setApplyingMitigation] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await getFeedRepresentationMetrics('30d');
      setMetrics(data);
    } catch (error) {
      addToast('Failed to load feed representation metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const runBiasAnalysis = async () => {
    try {
      // Sample feed content for analysis - in production this would be actual feed data
      const sampleFeedContent = Array.from({ length: 50 }, (_, i) => ({
        id: `post-${i}`,
        authorId: `user-${i}`,
        contentType: 'post',
        moderationDecision: Math.random() > 0.9 ? 'removed' : 'approved',
        moderatedGroup: Math.random() > 0.8 ? 'marginalized' : null
      }));

      const analysis = await analyzeBias(sampleFeedContent, {
        userId: 'current-admin-id',
        timeframe: '7d',
        contentTypes: ['post', 'comment', 'reel']
      });
      
      setBiasAnalysis(analysis);
      addToast('Bias analysis completed successfully', 'success');
    } catch (error) {
      addToast('Failed to run bias analysis', 'error');
    }
  };

  const handleApplyMitigation = async (strategy: string) => {
    setApplyingMitigation(true);
    try {
      await applyBiasMitigations(strategy);
      addToast(`Successfully applied: ${strategy}`, 'success');
      // Refresh metrics after applying mitigations
      fetchMetrics();
    } catch (error) {
      addToast('Failed to apply mitigation strategy', 'error');
    } finally {
      setApplyingMitigation(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-500">High severity</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium severity</Badge>;
      case 'low':
        return <Badge className="bg-green-500">Low severity</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="mt-12 space-y-6">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Bias Detection & Mitigation</h2>
        </div>
        <Card className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Bias Detection & Mitigation</h2>
          <Badge variant="secondary">AI-Powered</Badge>
        </div>
        <Button onClick={runBiasAnalysis} className="gap-2">
          <Shield className="h-4 w-4" />
          Run Bias Analysis
        </Button>
      </div>

      {/* Feed Representation Score */}
      {metrics && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium">Feed Representation Score</h3>
            </div>
            <span className="text-2xl font-bold">{Math.round(metrics.overallRepresentationScore)}%</span>
          </div>
          
          <Progress value={metrics.overallRepresentationScore} className="h-3 mb-6" />
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {Object.entries(metrics.demographicBreakdown).map(([group, percentage]) => (
              <div key={group} className="text-center">
                <div className="text-sm font-medium capitalize">{group.replace('_', ' ')}</div>
                <div className="text-2xl font-bold">{percentage}%</div>
              </div>
            ))}
          </div>

          {/* Historical Trends */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <LineChart className="h-5 w-5 text-green-500" />
              <h4 className="font-medium">30-Day Trend</h4>
            </div>
            <div className="flex items-end gap-1 h-32">
              {metrics.historicalTrends.slice(-30).map((day: any, i: number) => (
                <div 
                  key={i} 
                  className="flex-1 bg-blue-500 rounded-t"
                  style={{ height: `${day.score}%` }}
                  title={`${day.date}: ${day.score}%`}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Bias Analysis Results */}
      {biasAnalysis && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium">Latest Bias Analysis Results</h3>
            </div>
            {getSeverityBadge(biasAnalysis.biasSeverity)}
          </div>

          {biasAnalysis.detectedBiasTypes.length > 0 ? (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Detected Bias Types</h4>
                <div className="flex flex-wrap gap-2">
                  {biasAnalysis.detectedBiasTypes.map((type, i) => (
                    <Badge key={i} variant="outline">{type.replace('_', ' ')}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Affected Groups</h4>
                <div className="flex flex-wrap gap-2">
                  {biasAnalysis.affectedGroups.map((group, i) => (
                    <Badge key={i} className="bg-red-100 text-red-800">{group}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recommended Mitigations</h4>
                <div className="space-y-2">
                  {biasAnalysis.mitigationSuggestions.map((suggestion, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span>{suggestion}</span>
                      <Button 
                        size="sm" 
                        onClick={() => handleApplyMitigation(suggestion)}
                        disabled={applyingMitigation}
                        className="gap-1"
                      >
                        <TrendingUp className="h-3 w-3" />
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium">No significant bias detected</h3>
              <p className="text-gray-500 mt-1">Your content feeds maintain good demographic representation.</p>
            </div>
          )}
        </Card>
      )}

      {/* Improvement Suggestions */}
      {metrics && metrics.improvementSuggestions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Suggested Improvements</h3>
          <ul className="space-y-2">
            {metrics.improvementSuggestions.map((suggestion: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}