import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Leaf, TreeDeciduous, TrendingUp, Recycle, Globe, Award } from 'lucide-react';
import { formatCarbonEmissions, getPlatformSustainabilityMetrics } from '../lib/carbonCalculator';
import { Badge } from '../components/ui/badge';

type UserContentEmissions = {
  postId: string;
  postType: string;
  createdAt: string;
  emissions: number;
  offset: number;
  netEmissions: number;
  sustainabilityScore: number;
};

type UserSustainabilityData = {
  totalEmissions: number;
  totalOffset: number;
  netEmissions: number;
  totalEmissionsSaved: number;
  averageSustainabilityScore: number;
  monthlyEmissions: { month: string; emissions: number; offset: number }[];
  contentBreakdown: { type: string; emissions: number; count: number }[];
  userRank: number;
  totalUsers: number;
  achievements: { id: string; name: string; description: string; unlockedAt: string | null }[];
  recentContent: UserContentEmissions[];
};

const EMPTY_SUSTAINABILITY_DATA: UserSustainabilityData = {
  totalEmissions: 0,
  totalOffset: 0,
  netEmissions: 0,
  totalEmissionsSaved: 0,
  averageSustainabilityScore: 0,
  monthlyEmissions: [],
  contentBreakdown: [],
  userRank: 0,
  totalUsers: 0,
  achievements: [],
  recentContent: [],
};

// Mock data for demonstration
const MOCK_SUSTAINABILITY_DATA: UserSustainabilityData = {
  totalEmissions: 125.5,
  totalOffset: 50.2,
  netEmissions: 75.3,
  totalEmissionsSaved: 45.8,
  averageSustainabilityScore: 78,
  monthlyEmissions: [
    { month: 'Jan', emissions: 18, offset: 7.2 },
    { month: 'Feb', emissions: 16, offset: 6.4 },
    { month: 'Mar', emissions: 14, offset: 5.6 },
    { month: 'Apr', emissions: 15, offset: 6 },
    { month: 'May', emissions: 13, offset: 5.2 },
    { month: 'Jun', emissions: 12, offset: 4.8 },
    { month: 'Jul', emissions: 10, offset: 4 },
    { month: 'Aug', emissions: 9, offset: 3.6 },
    { month: 'Sep', emissions: 11, offset: 4.4 },
    { month: 'Oct', emissions: 8, offset: 3.2 },
  ],
  contentBreakdown: [
    { type: 'video', emissions: 78.2, count: 12 },
    { type: 'image', emissions: 32.1, count: 45 },
    { type: 'audio', emissions: 10.2, count: 8 },
    { type: 'text', emissions: 5.0, count: 67 },
  ],
  userRank: 1247,
  totalUsers: 150000,
  achievements: [
    { id: 'first-post', name: 'First Step', description: 'Created your first piece of content', unlockedAt: '2025-01-15' },
    { id: 'eco-warrior', name: 'Eco Warrior', description: 'Maintained an average sustainability score above 70 for 3 months', unlockedAt: '2025-04-20' },
    { id: 'carbon-cutter', name: 'Carbon Cutter', description: 'Reduced your monthly emissions by 50%', unlockedAt: '2025-10-05' },
    { id: 'tree-planter', name: 'Tree Planter', description: 'Your usage has contributed to planting 10 trees', unlockedAt: null },
  ],
  recentContent: [
    { postId: '1', postType: 'video', createdAt: '2025-10-20', emissions: 2.5, offset: 1.0, netEmissions: 1.5, sustainabilityScore: 82 },
    { postId: '2', postType: 'image', createdAt: '2025-10-18', emissions: 0.015, offset: 0.006, netEmissions: 0.009, sustainabilityScore: 95 },
    { postId: '3', postType: 'video', createdAt: '2025-10-15', emissions: 1.8, offset: 0.72, netEmissions: 1.08, sustainabilityScore: 88 },
    { postId: '4', postType: 'text', createdAt: '2025-10-12', emissions: 0.001, offset: 0.0004, netEmissions: 0.0006, sustainabilityScore: 100 },
  ],
};

export const SustainabilityPage = () => {
  const [sustainabilityData, setSustainabilityData] = useState<UserSustainabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const platformMetrics = getPlatformSustainabilityMetrics();

  useEffect(() => {
    // Simulate API call to fetch user's sustainability data
    setTimeout(() => {
      setSustainabilityData(MOCK_SUSTAINABILITY_DATA);
      setLoading(false);
    }, 1000);
  }, []);

  const data = sustainabilityData ?? EMPTY_SUSTAINABILITY_DATA;

  if (loading) {
    return (
      <PageShell title="Sustainability Dashboard">
        <p>Loading your carbon footprint data...</p>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Sustainability Dashboard">
        <p className="text-sm text-dark-600 dark:text-dark-300">{error}</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Sustainability Dashboard">
      <div className="space-y-8">
        {/* Platform Impact Overview */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Platform Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-600" />
                  Renewable Energy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{platformMetrics.renewableEnergyPercentage}%</p>
                <p className="text-sm text-gray-500">of energy from renewables</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Recycle className="h-4 w-4 text-blue-600" />
                  Emissions Offset
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{(platformMetrics.totalEmissionsOffsetToDate / 1000).toFixed(0)}k</p>
                <p className="text-sm text-gray-500">tonnes of CO2e offset to date</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TreeDeciduous className="h-4 w-4 text-green-700" />
                  Trees Planted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{(platformMetrics.treesPlanted / 1000).toFixed(0)}k</p>
                <p className="text-sm text-gray-500">through reforestation programs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  User Emissions Saved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{(platformMetrics.usersCarbonSaved / 1000).toFixed(0)}k</p>
                <p className="text-sm text-gray-500">tonnes saved by sustainable choices</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Your Personal Impact */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Personal Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Emissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCarbonEmissions(data.totalEmissions * 1000)}</p>
                <p className="text-sm text-gray-500">lifetime from your content</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Platform Offset</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCarbonEmissions(data.totalOffset * 1000)}</p>
                <p className="text-sm text-gray-500">offset through platform initiatives</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Your Net Emissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCarbonEmissions(data.netEmissions * 1000)}</p>
                <p className="text-sm text-gray-500">after platform offsets</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg. Sustainability Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data.averageSustainabilityScore}/100</p>
                <p className="text-sm text-gray-500">across all your content</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Monthly Emissions Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Emissions Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyEmissions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'kg CO2e', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => [`${value} kg CO2e`]} />
                  <Legend />
                  <Line type="monotone" dataKey="emissions" stroke="#ef4444" name="Gross Emissions" strokeWidth={2} />
                  <Line type="monotone" dataKey="offset" stroke="#22c55e" name="Offset by Platform" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Content Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Emissions by Content Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.contentBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis label={{ value: 'kg CO2e', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => [`${value} kg CO2e`]} />
                  <Bar dataKey="emissions" fill="#3b82f6" name="Emissions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.achievements.map((achievement) => (
              <Card key={achievement.id} className={achievement.unlockedAt ? '' : 'opacity-50'}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className={`h-4 w-4 ${achievement.unlockedAt ? 'text-yellow-500' : 'text-gray-400'}`} />
                    {achievement.name}
                    {achievement.unlockedAt && (
                      <Badge className="ml-2 bg-green-100 text-green-800">Unlocked</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{achievement.description}</p>
                  {achievement.unlockedAt && (
                    <p className="text-xs text-gray-400 mt-1">Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard Position */}
        <Card>
          <CardHeader>
            <CardTitle>Your Sustainability Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full">
                <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">Top {((data.userRank / data.totalUsers) * 100).toFixed(1)}%</p>
                <p className="text-sm text-gray-500">You're ranked #{data.userRank} out of {data.totalUsers.toLocaleString()} users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};