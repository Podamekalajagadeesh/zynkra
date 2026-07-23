import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  addCompetitor, 
  removeCompetitor, 
  getCompetitors, 
  getCompetitorComparison, 
  searchUsers,
  CompetitorProfile,
  CompetitorComparisonData
} from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type CompetitorAnalyticsProps = {
  userAnalytics: any;
};

export const CompetitorAnalytics = ({ userAnalytics }: CompetitorAnalyticsProps) => {
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([]);
  const [comparisonData, setComparisonData] = useState<CompetitorComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CompetitorProfile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadCompetitorData();
  }, []);

  const loadCompetitorData = async () => {
    try {
      const [competitorsList, comparison] = await Promise.all([
        getCompetitors(),
        getCompetitorComparison()
      ]);
      setCompetitors(competitorsList);
      setComparisonData(comparison);
    } catch (error) {
      console.error('Failed to load competitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results.filter((r: CompetitorProfile) => !competitors.find(c => c.id === r.id)));
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCompetitor = async (username: string) => {
    try {
      const newCompetitor = await addCompetitor(username);
      setCompetitors([...competitors, newCompetitor]);
      setSearchResults(searchResults.filter(r => r.username !== username));
      await loadCompetitorData();
    } catch (error) {
      console.error('Failed to add competitor:', error);
    }
  };

  const handleRemoveCompetitor = async (competitorId: string) => {
    try {
      await removeCompetitor(competitorId);
      setCompetitors(competitors.filter(c => c.id !== competitorId));
      await loadCompetitorData();
    } catch (error) {
      console.error('Failed to remove competitor:', error);
    }
  };

  const getComparisonChartData = () => {
    if (!comparisonData) return [];
    
    const data = [
      {
        name: 'Followers',
        You: comparisonData.yourMetrics.followerCount,
        ...Object.fromEntries(
          comparisonData.competitors.map(c => [c.profile.username, c.followerCount])
        )
      },
      {
        name: 'Engagement Rate (%)',
        You: comparisonData.yourMetrics.engagementRate,
        ...Object.fromEntries(
          comparisonData.competitors.map(c => [c.profile.username, c.engagementRate])
        )
      },
      {
        name: 'Avg Likes/Post',
        You: comparisonData.yourMetrics.averageLikes,
        ...Object.fromEntries(
          comparisonData.competitors.map(c => [c.profile.username, c.averageLikes])
        )
      },
      {
        name: 'Posts/Week',
        You: comparisonData.yourMetrics.postFrequency,
        ...Object.fromEntries(
          comparisonData.competitors.map(c => [c.profile.username, c.postFrequency])
        )
      }
    ];
    
    return data;
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#0088fe', '#00C49F'];

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Loading competitor analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Competitor Analytics</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Competitor</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add a competitor to track</DialogTitle>
            </DialogHeader>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search by username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAddCompetitor(user.username)}>Add</Button>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && !isSearching && (
                <p className="text-sm text-gray-500 text-center">No users found</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tracked Competitors List */}
      {competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tracked Competitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitors.map((competitor) => (
                <div key={competitor.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img src={competitor.avatarUrl} alt={competitor.displayName} className="w-12 h-12 rounded-full" />
                      <div>
                        <p className="font-semibold">{competitor.displayName}</p>
                        <p className="text-sm text-gray-500">@{competitor.username}</p>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleRemoveCompetitor(competitor.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Category: {competitor.category}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Chart */}
      {comparisonData && comparisonData.competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={getComparisonChartData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                {Object.keys(getComparisonChartData()[0] || {}).filter(key => key !== 'name').map((key, index) => (
                  <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} name={key} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Comparison Table */}
      {comparisonData && comparisonData.competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Metrics Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Metric</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">You</th>
                    <th className="border border-gray-300 dark:border-gray-700 p-3 text-left">Industry Average</th>
                    {comparisonData.competitors.map((c) => (
                      <th key={c.profile.id} className="border border-gray-300 dark:border-gray-700 p-3 text-left">{c.profile.username}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="border border-gray-300 dark:border-gray-700 p-3 font-medium">Followers</td>
                    <td className="border border-gray-300 dark:border-gray-700 p-3">{comparisonData.yourMetrics.followerCount.toLocaleString()}</td>
                    <td className="border border-gray-300 dark:border-gray-700 p-3">-</td>
                    {comparisonData.competitors.map((c) => (
                      <td key={c.profile.id} className="border border-gray-300 dark:border-gray-700 p-3">{c.followerCount.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="border border-gray-300 dark:border-gray-700 p-3 font-medium">Follower Growth (30d)</td>
                    <td className="border border-gray-300 dark:border-gray-700 p-3">+{comparisonData.yourMetrics.followerGrowth}</td>
                    <td className="border border-gray-300 dark:border-gray-700 p-3">{comparisonData.industryAverages.followerGrowth}%</td>
                    {comparisonData.competitors.map((c) => (
                      <td key={c.profile.id} className="border border-gray-300 dark:border-gray-700 p-3">+{c.followerGrowth} ({c.followerGrowthRate})</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="border border-gray-300 dark:border-gray-700 p-3 font-medium">Engagement Rate</td>
                    <td className="border border-gray-300 dark:border-gray-700 p-3">{comparisonData.yourMetrics.engagementRate.toFixed(2)}%</td>
                    <td className="border border-gray-300 dark:border-gray-700 p-3">{comparisonData.industryAverages.engagementRate.toFixed(2)}%</td>
                    {comparisonData.competitors.map((c) => (
                      <td key={c.profile.id} className="border border-gray-300 dark:border-gray-700 p-3">{c.engagementRate.toFixed(2)}%</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="border border-gray-300 dark:border-gray-700 p-3 font-medium">Avg Likes/Post</td>
                    <td className="border border-gray-300 dark:border-gray-700 p-3">{comparisonData.yourMetrics.averageLikes.toLocaleString()}</td>
                    <td className="border border-gray-300 dark:border-gray-700 p-3">{comparisonData.industryAverages.averageLikes.toLocaleString()}</td>
                    {comparisonData.competitors.map((c) => (
                      <td key={c.profile.id} className="border border-gray-300 dark:border-gray-700 p-3">{c.averageLikes.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="border border-gray-300 dark:border-gray-700 p-3 font-medium">Posts/Week</td>
                    <td className="border border-gray-300 dark:border-gray-700 p-3">{comparisonData.yourMetrics.postFrequency}</td>
                    <td className="border border-gray-300 dark:border-gray-700 p-3">{comparisonData.industryAverages.postFrequency}</td>
                    {comparisonData.competitors.map((c) => (
                      <td key={c.profile.id} className="border border-gray-300 dark:border-gray-700 p-3">{c.postFrequency}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {competitors.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">No competitors added yet. Start tracking similar creators or brands to compare your performance!</p>
            <Button onClick={() => setIsDialogOpen(true)}>Add Your First Competitor</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};